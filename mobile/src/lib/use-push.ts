import { useCallback, useEffect, useState } from 'react';

import { enablePush, getPushStatus, registerPhone, type PushStatus } from './push';

/**
 * Push state for the signed-in person. If they already allowed notifications
 * the phone is registered straight away; otherwise the screen can offer
 * `enable()`, which shows the system prompt.
 */
export function usePush() {
  const [status, setStatus] = useState<PushStatus>('unavailable');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void getPushStatus().then((s) => {
      if (!active) return;
      setStatus(s);
      if (s === 'granted') void registerPhone();
    });
    return () => {
      active = false;
    };
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      setStatus(await enablePush());
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, enable };
}
