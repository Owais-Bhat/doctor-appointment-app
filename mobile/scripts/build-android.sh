#!/usr/bin/env bash
# Builds a signed release APK on this machine, without Expo's cloud build.
#
# One-time setup: JDK 17, the Android SDK (platform 37, build-tools 37.0.0,
# NDK 27.1.12297006, CMake 3.22.1) and a release keystore. See "Build without
# Expo" in mobile/README.md. Then:
#
#   export ANDROID_HOME=/path/to/android-sdk
#   export MEDFLOW_KEYSTORE=/path/to/medflow-release.jks
#   export MEDFLOW_KEYSTORE_PASSWORD=...
#   export MEDFLOW_KEY_ALIAS=medflow            # default
#   export MEDFLOW_KEY_PASSWORD=...             # default: same as the keystore password
#   ./scripts/build-android.sh                  # arm64 phones; ARCHS=arm64-v8a,x86_64 for more
#
# The APK is written to dist/MedFlow-<version>.apk. Never commit the keystore.
set -euo pipefail
cd "$(dirname "$0")/.."

: "${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK folder}"
: "${MEDFLOW_KEYSTORE:?Set MEDFLOW_KEYSTORE to your release keystore (.jks)}"
: "${MEDFLOW_KEYSTORE_PASSWORD:?Set MEDFLOW_KEYSTORE_PASSWORD}"
export MEDFLOW_KEY_ALIAS="${MEDFLOW_KEY_ALIAS:-medflow}"
export MEDFLOW_KEY_PASSWORD="${MEDFLOW_KEY_PASSWORD:-$MEDFLOW_KEYSTORE_PASSWORD}"
[ -f "$MEDFLOW_KEYSTORE" ] || { echo "Keystore not found: $MEDFLOW_KEYSTORE" >&2; exit 1; }
export ANDROID_SDK_ROOT="$ANDROID_HOME" CI=1 EXPO_NO_TELEMETRY=1

# The public app settings (API address, Firebase, Google client) live in eas.json
eval "$(python3 - <<'PY'
import json, shlex
for k, v in json.load(open('eas.json'))['build']['base']['env'].items():
    print(f'export {k}={shlex.quote(v)}')
PY
)"

echo "==> Generating the native Android project"
# prebuild rewrites the "android"/"ios" scripts in package.json; put the file back afterwards
PKG_BACKUP="$(mktemp)"; cp package.json "$PKG_BACKUP"
npx expo prebuild --platform android --no-install --clean
cp "$PKG_BACKUP" package.json; rm -f "$PKG_BACKUP"

echo "==> Setting up signing"
python3 - <<'PY'
import re
p = 'android/app/build.gradle'
s = open(p).read()
release = """        release {
            storeFile file(System.getenv('MEDFLOW_KEYSTORE'))
            storePassword System.getenv('MEDFLOW_KEYSTORE_PASSWORD')
            keyAlias System.getenv('MEDFLOW_KEY_ALIAS')
            keyPassword System.getenv('MEDFLOW_KEY_PASSWORD')
        }
"""
s = s.replace("    signingConfigs {\n        debug {", "    signingConfigs {\n" + release + "        debug {", 1)
# the release build type, not the debug one
s = re.sub(r"(release \{\n(?:\s*//.*\n)*\s*)signingConfig signingConfigs\.debug", r"\1signingConfig signingConfigs.release", s, count=1)
assert 'signingConfigs.release' in s, 'could not switch the release build to your keystore'
open(p, 'w').write(s)
PY
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
sed -i 's/^org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx5g -XX:MaxMetaspaceSize=1g/' android/gradle.properties

echo "==> Building (the first build downloads a lot and takes 10-25 minutes)"
# AAB=1 builds the Play Store bundle (all phone architectures) instead of an APK
if [ "${AAB:-0}" = "1" ]; then
  (cd android && ./gradlew bundleRelease -PreactNativeArchitectures="${ARCHS:-armeabi-v7a,arm64-v8a,x86,x86_64}" --no-daemon --console=plain)
else
  (cd android && ./gradlew assembleRelease -PreactNativeArchitectures="${ARCHS:-arm64-v8a}" --no-daemon --console=plain)
fi

VERSION="$(python3 -c "import json; print(json.load(open('app.json'))['expo']['version'])")"
mkdir -p dist
if [ "${AAB:-0}" = "1" ]; then
  cp android/app/build/outputs/bundle/release/app-release.aab "dist/MedFlow-$VERSION.aab"
  echo "==> Done: dist/MedFlow-$VERSION.aab"
  exit 0
fi
cp android/app/build/outputs/apk/release/app-release.apk "dist/MedFlow-$VERSION.apk"
echo "==> Done: dist/MedFlow-$VERSION.apk"
"$ANDROID_HOME"/build-tools/*/apksigner verify --print-certs "dist/MedFlow-$VERSION.apk" | grep -E "Signer #1 certificate (DN|SHA-1)" || true
