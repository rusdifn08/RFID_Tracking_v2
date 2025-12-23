/**
 * Test script untuk API Card endpoints
 * 
 * Cara menjalankan:
 * 1. Pastikan server.js berjalan di port 8000
 * 2. Pastikan backend API berjalan di http://10.8.0.104:7000
 * 3. Jalankan: node test-card-api.js
 */

const API_BASE_URL = 'http://localhost:8000';

async function testCardAPI() {
    console.log('🧪 Testing Card API Endpoints...\n');
    console.log('='.repeat(60));

    // Test 1: GET /card (Summary)
    console.log('\n📊 Test 1: GET /card (Summary)');
    console.log('-'.repeat(60));
    try {
        const response = await fetch(`${API_BASE_URL}/card`);
        const data = await response.json();
        console.log('✅ Status:', response.status);
        console.log('📦 Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 2: GET /card/progress
    console.log('\n📊 Test 2: GET /card/progress');
    console.log('-'.repeat(60));
    try {
        const response = await fetch(`${API_BASE_URL}/card/progress`);
        const data = await response.json();
        console.log('✅ Status:', response.status);
        console.log('📦 Count:', data.count || 0);
        console.log('📦 Data items:', data.data?.length || 0);
        if (data.data && data.data.length > 0) {
            console.log('📦 First item:', JSON.stringify(data.data[0], null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 3: GET /card/done
    console.log('\n📊 Test 3: GET /card/done');
    console.log('-'.repeat(60));
    try {
        const response = await fetch(`${API_BASE_URL}/card/done`);
        const data = await response.json();
        console.log('✅ Status:', response.status);
        console.log('📦 Count:', data.count || 0);
        console.log('📦 Data items:', data.data?.length || 0);
        if (data.data && data.data.length > 0) {
            console.log('📦 First item:', JSON.stringify(data.data[0], null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 4: GET /card/waiting
    console.log('\n📊 Test 4: GET /card/waiting');
    console.log('-'.repeat(60));
    try {
        const response = await fetch(`${API_BASE_URL}/card/waiting`);
        const data = await response.json();
        console.log('✅ Status:', response.status);
        console.log('📦 Count:', data.count || 0);
        console.log('📦 Data items:', data.data?.length || 0);
        if (data.data && data.data.length > 0) {
            console.log('📦 First item:', JSON.stringify(data.data[0], null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 5: Test semua endpoint secara parallel (seperti di frontend)
    console.log('\n📊 Test 5: Parallel fetch (seperti di frontend)');
    console.log('-'.repeat(60));
    try {
        const [progressResponse, doneResponse, waitingResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/card/progress`),
            fetch(`${API_BASE_URL}/card/done`),
            fetch(`${API_BASE_URL}/card/waiting`),
        ]);

        const progressData = progressResponse.ok ? await progressResponse.json() : { data: [] };
        const doneData = doneResponse.ok ? await doneResponse.json() : { data: [] };
        const waitingData = waitingResponse.ok ? await waitingResponse.json() : { data: [] };

        const totalData = [
            ...(progressData.data || []),
            ...(doneData.data || []),
            ...(waitingData.data || []),
        ];

        console.log('✅ All requests completed');
        console.log('📦 Progress items:', progressData.data?.length || 0);
        console.log('📦 Done items:', doneData.data?.length || 0);
        console.log('📦 Waiting items:', waitingData.data?.length || 0);
        console.log('📦 Total items:', totalData.length);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Testing completed!\n');
}

// Jalankan test
testCardAPI().catch(console.error);
