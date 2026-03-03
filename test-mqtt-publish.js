/**
 * Program testing MQTT: mengirim pesan ke broker.
 * Topic sesuai environment: line{N}/qc/{env}, line{N}/pqc/{env} (env = mjl | mjl2 | cln).
 *
 * Cara pakai:
 *   node test-mqtt-publish.js                 → line1, both, success, env mjl
 *   node test-mqtt-publish.js 2              → line2, both, env mjl
 *   node test-mqtt-publish.js 1 pqc success  → line1/pqc/mjl
 *   node test-mqtt-publish.js 1 pqc success mjl2
 *
 * Env (opsional): MQTT_BROKER_URL=mqtt://10.5.0.106:1883
 */

import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://10.5.0.106:1883';

const args = process.argv.slice(2);
const lineNum = args[0] || '1';
const role = (args[1] || 'both').toLowerCase();
const payload = args[2] ?? 'success';
const env = (args[3] || process.env.MQTT_ENV || 'mjl').toLowerCase(); // mjl | mjl2 | cln

const topics = [];
if (role === 'both' || role === 'qc') topics.push(`line${lineNum}/qc/${env}`);
if (role === 'both' || role === 'pqc') topics.push(`line${lineNum}/pqc/${env}`);

if (topics.length === 0) {
    console.error('Role harus: qc | pqc | both');
    process.exit(1);
}

console.log('\n📤 [MQTT TEST] Publishing...');
console.log('   Broker:', BROKER_URL);
console.log('   Topics:', topics.join(', '));
console.log('   Payload:', payload);

const client = mqtt.connect(BROKER_URL, {
    connectTimeout: 5000,
    clientId: `test_pub_${Date.now()}`,
});

client.on('connect', () => {
    console.log('✅ Connected to broker');
    // Jeda singkat agar server (subscriber) sempat ready, lalu kirim
    setTimeout(() => {
        let done = 0;
        topics.forEach((topic) => {
            client.publish(topic, payload, { qos: 0 }, (err) => {
                if (err) {
                    console.error(`❌ Publish error [${topic}]:`, err.message);
                } else {
                    console.log(`   Published → ${topic} : "${payload}"`);
                }
                done++;
                if (done === topics.length) {
                    // Tunggu 2 detik agar broker sempat mengirim ke server, baru tutup
                    console.log('\n   Menunggu 2 detik agar pesan sampai ke server...');
                    setTimeout(() => {
                        console.log('✅ Selesai. Cek terminal server.js untuk log "Message received".\n');
                        client.end(true);
                    }, 2000);
                }
            });
        });
    }, 1000);
});

client.on('error', (err) => {
    console.error('❌ MQTT Error:', err.message);
    process.exit(1);
});

client.on('close', () => {
    process.exit(0);
});

setTimeout(() => {
    console.error('❌ Timeout: tidak bisa connect ke broker. Pastikan broker MQTT jalan dan URL benar.');
    client.end(true);
    process.exit(1);
}, 8000);
