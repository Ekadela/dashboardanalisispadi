// Konfigurasi Warna
const COLORS = {
    padi: '#f8b400',
    green: '#016a41',
    dark: '#0d3b2e'
};

async function initDashboard() {
    // 1. Ambil Data
    const data2025 = await fetchCSV('data/2025.csv');
    const data2024 = await fetchCSV('data/2024.csv');
    const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    
    // 2. Update KPI
    updateKPI(data2025, data2024);
    
    // 3. Render Charts
    renderTrendChart(years); // Perlu fetching semua tahun
    renderTop5(data2025);
    renderMap(data2025);
    initKabupatenExplorer(years);
    renderInsights(data2025, data2024);
}

async function fetchCSV(path) {
    const response = await fetch(path);
    const text = await response.text();
    return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
}

function updateKPI(d25, d24) {
    const sum = (data, key) => data.reduce((a, b) => a + Number(b[key] || 0), 0);
    
    const prod25 = sum(d25, 'Produksi');
    const prod24 = sum(d24, 'Produksi');
    const growth = ((prod25 - prod24) / prod24 * 100).toFixed(2);
    
    document.getElementById('prod2025').innerText = prod25.toLocaleString() + " Ton";
    document.getElementById('prod2024').innerText = prod24.toLocaleString();
    document.getElementById('growthProd').innerText = growth + "%";
}

function renderTop5(data) {
    const sorted = [...data].sort((a, b) => b.Produksi - a.Produksi).slice(0, 5);
    new Chart(document.getElementById('top5Chart'), {
        type: 'bar',
        data: {
            labels: sorted.map(d => d.Kabupaten),
            datasets: [{
                label: 'Produksi (Ton)',
                data: sorted.map(d => d.Produksi),
                backgroundColor: COLORS.green,
                borderRadius: 10
            }]
        },
        options: { 
            indexAxis: 'y', // Bar horizontal seperti infografis
            maintainAspectRatio: false 
        }
    });
}

// ... Tambahkan fungsi renderMap, renderTrendChart dsb ...
// Pastikan memanggil initDashboard() di akhir file
initDashboard();
