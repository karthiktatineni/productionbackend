import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
    vus: 100,         // 5 concurrent users
    duration: '10s', // Run for 10 seconds
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    },
};

export default function () {
    // Test Localhost (if available)
    try {
        const resLocal = http.get('http://localhost:5173');
        check(resLocal, {
            'Localhost status 200': (r) => r.status === 200,
        });
    } catch (e) {
        // Ignore localhost errors
    }

    // Test Production
    const resProd = http.get('https://iaremun.in');
    check(resProd, {
        'Production status 200': (r) => r.status === 200,
    });

    sleep(1);
}
