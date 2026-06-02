/**
 * Load Balancer API Routes
 *
 * POST /api/infrastructure/loadbalancer
 * - action: create-lb - Create load balancer
 * - action: add-instance - Add server instance
 * - action: route - Route request to instance
 * - action: release - Release connection
 * - action: disable-instance - Disable instance
 *
 * GET /api/infrastructure/loadbalancer
 * - action: instances - List instances
 * - action: metrics - Load balancer metrics
 * - action: instance-metrics - Instance metrics
 * - action: health-metrics - Health check metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoadBalancingService } from '@/lib/infrastructure/loadBalancing';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'enterprise');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const body = await req.json();
    const {
      action,
      organizationId,
      name,
      algorithm,
      hostname,
      port,
      region,
      weight,
      capacity,
      loadBalancerId,
      instanceId,
      clientIp,
      requestPath,
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'create-lb') {
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Missing name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const lb = await LoadBalancingService.createLoadBalancer(
        organizationId,
        name,
        algorithm || 'round-robin'
      );

      return NextResponse.json(
        { success: true, data: lb },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'add-instance') {
      if (!hostname || !port || !region) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const instance = await LoadBalancingService.createServerInstance(
        organizationId,
        hostname,
        port,
        region,
        weight || 1,
        capacity || 1000
      );

      return NextResponse.json(
        { success: true, data: instance },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'route') {
      if (!loadBalancerId || !clientIp || !requestPath) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const routing = await LoadBalancingService.routeRequest(
        organizationId,
        loadBalancerId,
        clientIp,
        requestPath
      );

      return NextResponse.json(
        { success: true, data: routing },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'release') {
      if (!instanceId) {
        return NextResponse.json(
          { success: false, error: 'Missing instanceId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await LoadBalancingService.releaseConnection(instanceId);

      return NextResponse.json(
        { success: true, message: 'Connection released' },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'disable-instance') {
      if (!instanceId) {
        return NextResponse.json(
          { success: false, error: 'Missing instanceId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await LoadBalancingService.disableInstance(instanceId);

      return NextResponse.json(
        { success: true, message: 'Instance disabled' },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/infrastructure/loadbalancer:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'enterprise');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const action = req.nextUrl.searchParams.get('action');
    const organizationId = req.nextUrl.searchParams.get('organizationId');
    const instanceId = req.nextUrl.searchParams.get('instanceId');
    const loadBalancerId = req.nextUrl.searchParams.get('loadBalancerId');
    const minutes = parseInt(req.nextUrl.searchParams.get('minutes') || '5');
    const hours = parseInt(req.nextUrl.searchParams.get('hours') || '1');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'metrics') {
      if (!loadBalancerId) {
        return NextResponse.json(
          { success: false, error: 'Missing loadBalancerId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metrics = await LoadBalancingService.getLoadBalancerMetrics(loadBalancerId, minutes);

      return NextResponse.json(
        { success: true, data: metrics },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'instance-metrics') {
      if (!instanceId) {
        return NextResponse.json(
          { success: false, error: 'Missing instanceId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metrics = await LoadBalancingService.getInstanceMetrics(instanceId);

      return NextResponse.json(
        { success: true, data: metrics },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'health-metrics') {
      if (!instanceId) {
        return NextResponse.json(
          { success: false, error: 'Missing instanceId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metrics = await LoadBalancingService.getHealthMetrics(instanceId, hours);

      return NextResponse.json(
        { success: true, data: metrics },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/infrastructure/loadbalancer:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
