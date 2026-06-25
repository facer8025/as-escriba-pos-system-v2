#!/usr/bin/env node
/**
 * ESCRIBA POS — Prueba de Estrés
 * 
 * Ejecuta: node stress-test.mjs
 * 
 * Requiere: autocannon (npm install -g autocannon)
 * 
 * Prueba los endpoints clave del sistema con carga simultánea.
 */

import http from 'http';
import autocannon from '/home/facer/.nvm/versions/node/v22.22.3/lib/node_modules/autocannon/autocannon.js';

const BASE = 'http://localhost:8082/api/v1';
const COMPANY_ID = '550e8400-e29b-41d4-a716-446655440001';

// === 1. Obtener token de autenticación ===
function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      usernameOrEmail: 'stress-admin@escriba.co',
      password: 'Admin123!'
    });
    const req = http.request(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const token = json?.data?.accessToken;
          if (token) resolve(token);
          else reject(new Error('No token in response: ' + body));
        } catch (e) {
          // Try demo credentials
          const data2 = JSON.stringify({
            usernameOrEmail: 'stress-admin@escriba.co',
            password: 'Admin123!'
          });
          const req2 = http.request(`${BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data2.length }
          }, (res2) => {
            let body2 = '';
            res2.on('data', chunk => body2 += chunk);
            res2.on('end', () => {
              try {
                const json2 = JSON.parse(body2);
                const token2 = json2?.data?.accessToken;
                if (token2) resolve(token2);
                else reject(new Error('Login failed: ' + body2));
              } catch { reject(new Error('Login parse failed: ' + body2)); }
            });
          });
          req2.write(data2);
          req2.end();
        }
      });
    });
    req.write(data);
    req.end();
  });
}

function formatDuration(ms) {
  if (ms > 1000) return (ms / 1000).toFixed(1) + 's';
  return ms.toFixed(0) + 'ms';
}

function runTest(label, url, opts = {}) {
  return new Promise((resolve) => {
    const instance = autocannon({
      url: BASE + url,
      connections: opts.connections || 10,
      duration: opts.duration || 10,
      pipelining: 1,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      ...opts.extra
    }, (err, result) => {
      if (err) {
        console.log(`  ❌ ${label}: ERROR — ${err.message}`);
        resolve();
        return;
      }
      const avgLatency = result.latency.average;
      const p99 = result.latency.p99;
      const reqSec = result.requests.average;
      const errors = result.errors || 0;
      const timeouts = result.timeouts || 0;
      const status = result['2xx'] || 0;
      const non2xx = result['non2xx'] || 0;

      console.log(`  ${label}:`);
      console.log(`    Peticiones/seg: ${reqSec.toFixed(1)}`);
      console.log(`    Latencia media: ${formatDuration(avgLatency)}`);
      console.log(`    Latencia P99:   ${formatDuration(p99)}`);
      console.log(`    2xx: ${status}  |  No-2xx: ${non2xx}  |  Errores: ${errors}  |  Timeouts: ${timeouts}`);
      resolve();
    });
  });
}

// === Main ===
let TOKEN;
try {
  console.log('\n🔐 Autenticando...');
  TOKEN = await login();
  console.log('   Token obtenido correctamente\n');
} catch (e) {
  console.log('   ⚠️  No se pudo autenticar. Los tests se ejecutarán sin token.');
  console.log(`   Error: ${e.message}\n`);
  TOKEN = '';
}

console.log('═══════════════════════════════════════════');
console.log('   ESCRIBA POS — PRUEBA DE ESTRÉS');
console.log('═══════════════════════════════════════════\n');

const CONNECTIONS = 20;
const DURATION = 15; // segundos por test

// 1. Dashboard
console.log('📊 Dashboard:');
await runTest('GET /dashboard/summary',
  `/dashboard/summary?companyId=${COMPANY_ID}`,
  { connections: CONNECTIONS, duration: DURATION });

// 2. Productos (paginación)
console.log('📦 Productos:');
await runTest('GET /products (page 1)',
  `/products?companyId=${COMPANY_ID}&page=0&size=25`,
  { connections: CONNECTIONS, duration: DURATION });
await runTest('GET /products (page 50)',
  `/products?companyId=${COMPANY_ID}&page=49&size=25`,
  { connections: 10, duration: DURATION });
await runTest('GET /products (search)',
  `/products?companyId=${COMPANY_ID}&search=Stress&page=0&size=25`,
  { connections: CONNECTIONS, duration: DURATION });

// 3. Clientes
console.log('👥 Clientes:');
await runTest('GET /customers',
  `/customers?companyId=${COMPANY_ID}`,
  { connections: CONNECTIONS, duration: DURATION });

// 4. Ventas
console.log('🧾 Ventas:');
await runTest('GET /sales',
  `/sales?companyId=${COMPANY_ID}&page=0&size=25`,
  { connections: CONNECTIONS, duration: DURATION });
await runTest('GET /sales (page 100)',
  `/sales?companyId=${COMPANY_ID}&page=99&size=25`,
  { connections: 10, duration: DURATION });

// 5. Reportes
console.log('📈 Reportes:');
await runTest('GET /reports/sales (30d)',
  `/reports/sales?companyId=${COMPANY_ID}`,
  { connections: 10, duration: DURATION });
await runTest('GET /reports/inventory',
  `/reports/inventory?companyId=${COMPANY_ID}`,
  { connections: CONNECTIONS, duration: DURATION });
await runTest('GET /reports/general',
  `/reports/general?companyId=${COMPANY_ID}`,
  { connections: CONNECTIONS, duration: DURATION });

// 6. Inventario
console.log('🏭 Inventario:');
await runTest('GET /inventory/summary',
  `/inventory/summary?companyId=${COMPANY_ID}`,
  { connections: CONNECTIONS, duration: DURATION });

// 7. Facturas
console.log('📄 Facturas:');
await runTest('GET /invoices',
  `/invoices?companyId=${COMPANY_ID}&page=0&size=25`,
  { connections: CONNECTIONS, duration: DURATION });

// 8. Notificaciones
console.log('🔔 Notificaciones:');
await runTest('GET /notifications/config',
  `/notifications/config?companyId=${COMPANY_ID}`,
  { connections: CONNECTIONS, duration: DURATION });

// 9. Login (rate limit test)
console.log('🔐 Login:');
await runTest('POST /auth/login (rate limit)',
  `/auth/login`,
  { connections: 5, duration: 5, extra: { method: 'POST', body: JSON.stringify({
    usernameOrEmail: 'stress-admin@escriba.co',
    password: 'wrong_password'
  })} });

console.log('\n═══════════════════════════════════════════');
console.log('   PRUEBA DE ESTRÉS COMPLETADA');
console.log('═══════════════════════════════════════════\n');
