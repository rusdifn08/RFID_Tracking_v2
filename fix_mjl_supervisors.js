const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'docker-data', 'supervisor_data.json');
if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    const correctNames = {
        '1': 'DATI&SUSI', '2': 'DALENA', '3': 'DEDE ROSIAH', '4': 'IYAH',
        '5': 'TITIN', '6': 'TINI', '7': 'WIDYA', '8': 'LINA', '9': 'MIA',
        '10': 'YUSNI', '11': 'SITI', '12': 'TINI (STIO DOWN)', '13': 'DEDE WINDY', '21': 'Dudung', '111': 'Rusdi'
    };

    if (!data.supervisors) data.supervisors = {};
    
    // Force update MJL supervisors to match the correct snapshot
    Object.keys(correctNames).forEach(id => {
        data.supervisors['MJL_' + id] = correctNames[id];
        // Also update the non-prefixed ones just in case
        data.supervisors[id] = correctNames[id];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✅ Successfully updated MJL supervisor data to match the snapshot!');
    console.log('Please restart your backend server (Ctrl+C then npm run dev:all:mjl).');
} else {
    console.log('supervisor_data.json not found, it will use defaults from server.js upon start.');
}
