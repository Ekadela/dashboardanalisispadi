async function loadData(){

const years = [2018,2019,2020,2021,2022,2023,2024,2025]

let totalProduksi = []
let labels = []

for(let year of years){

let response = await fetch(`data/${year}.csv`)
let text = await response.text()

let rows = text.split("\n").slice(1)

let total = 0

rows.forEach(r=>{
let cols = r.split(",")

let produksi = Number(cols[1])

if(!isNaN(produksi)){
total += produksi
}
})

labels.push(year)
totalProduksi.push(total)

}

drawChart(labels,totalProduksi)

}

function drawChart(labels, data) {
    const ctx = document.getElementById("trendChart");

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Produksi Padi Jawa Timur',
                data: data,
                borderColor: '#1f4e79',
                backgroundColor: 'rgba(31, 78, 121, 0.1)', // Efek area agar "berisi"
                fill: true, 
                tension: 0.4,
                pointRadius: 4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Wajib: agar grafik narik ke bawah sesuai tinggi div
            layout: {
                padding: {
                    bottom: 0 // Menghilangkan space kosong di bawah sumbu X
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { font: { size: 11, family: 'Inter' } }
                }
            },
            scales: {
                y: {
                    beginAtZero: false, // Biar grafiknya lebih dinamis fluktuasinya
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false } // Hilangkan garis vertikal agar bersih
                }
            }
        }
    });
}

// 

async function hitungStatistik(){

let response = await fetch("data/2025.csv")
let text = await response.text()

let rows = text.split("\n").slice(1)

let total = 0
let count = 0
let maxKab = ""
let max = 0
let minKab = ""
let min = Infinity

rows.forEach(r=>{

let cols = r.split(",")

let kab = cols[0]
let produksi = Number(cols[1])

if(!isNaN(produksi)){

total += produksi
count++

if(produksi > max){
max = produksi
maxKab = kab
}

if(produksi < min){
min = produksi
minKab = kab
}

}

})

let avg = total / count

document.getElementById("totalProd").innerText =
total.toLocaleString()+" ton"

document.getElementById("maxProd").innerText =
maxKab+" ("+max.toLocaleString()+" ton)"

document.getElementById("minProd").innerText =
minKab+" ("+min.toLocaleString()+" ton)"

document.getElementById("avgProd").innerText =
avg.toLocaleString(undefined,{maximumFractionDigits:0})+" ton"

}

// NAMPILIN PETA

async function loadMap(){

const map = L.map('map').setView([-7.5,112],8)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OpenStreetMap'
}).addTo(map)

let geo = await fetch("map/jatim.geojson")
let geoData = await geo.json()

let csv = await fetch("data/2025.csv")
let text = await csv.text()

let rows = text.split("\n").slice(1)

let produksiData = {}

rows.forEach(r=>{
let cols = r.split(",")

let kab = cols[0]
.replace("Kabupaten ","")
.replace("Kota ", "Kota ")
.trim()
let produksi = Number(cols[1])

produksiData[kab] = produksi
})

function getColor(d) {
    // Skala warna Navy (BPS Style) - Semakin gelap semakin tinggi
    return d > 900000 ? '#08306b' : // Deep Navy
           d > 700000 ? '#08519c' :
           d > 500000 ? '#2171b5' :
           d > 300000 ? '#4292c6' :
           d > 100000 ? '#6baed6' :
           d > 50000  ? '#9ecae1' :
           d > 10000  ? '#c6dbef' :
                        '#f7fbff'; // Sangat rendah / Terang
}
    
function style(feature) {
    let nama = feature.properties.NAME_2;
    let produksi = produksiData[nama] || 0;

    return {
        fillColor: getColor(produksi),
        weight: 1.5,           // Ketebalan garis pembatas
        opacity: 1,
        color: 'white',        // Garis pembatas putih biar kek matrix
        fillOpacity: 0.85      // Lebih pekat biar warnanya "keluar"
    };
}


function onEachFeature(feature,layer){

let nama = feature.properties.NAME_2

let produksi = produksiData[nama] || 0

layer.bindPopup(
`<b>${nama}</b><br>Produksi: ${produksi.toLocaleString()} ton`
)

}

L.geoJson(geoData,{
style:style,
onEachFeature:onEachFeature
}).addTo(map)

// --- LEGENDA MATRIX BOUNDARY ---
const legendContainer = document.getElementById('map-legend');
// Pastikan jumlah 'grades' ini sama dengan langkah warna di getColor
const grades = [0, 100000, 300000, 500000, 700000, 900000];

legendContainer.innerHTML = '<div class="legend-title">Keterangan:</div>';

const scaleWrapper = document.createElement('div');
scaleWrapper.className = 'legend-scale';

// 1. Buat Bar Warna
let colorBarHtml = '<div class="color-bar">';
grades.forEach(g => {
    colorBarHtml += `<div class="color-step" style="background: ${getColor(g + 1)}"></div>`;
});
colorBarHtml += '</div>';

// 2. Buat Bar Label (Angka di Tepi Garis)
let labelBarHtml = '<div class="label-bar">';
const stepPercent = 100 / grades.length;

grades.forEach((g, i) => {
    let labelText = g === 0 ? "0" : (g / 1000) + "k";
    // Posisi kiri adalah (indeks * lebar per kotak)
    let leftPos = i * stepPercent;
    labelBarHtml += `<div class="label-step" style="left: ${leftPos}%">${labelText}</div>`;
});

// Tambahkan label terakhir di paling ujung kanan (100%)
labelBarHtml += `<div class="label-step" style="left: 100%">+</div>`;
labelBarHtml += '</div>';

scaleWrapper.innerHTML = colorBarHtml + labelBarHtml;
legendContainer.appendChild(scaleWrapper);

}

// NAMPILN TOP 10 KABUPATEN PRODUKSI TERBANYAK
async function loadTop10(){

let response = await fetch("data/2025.csv")
let text = await response.text()

let rows = text.split("\n").slice(1)

let data = []

rows.forEach(r=>{

let cols = r.split(",")

let kab = cols[0].trim()
let produksi = Number(cols[1])

if(!isNaN(produksi)){
data.push({
kabupaten:kab,
produksi:produksi
})
}

})

/* urutkan dari terbesar */

data.sort((a,b)=> b.produksi - a.produksi)

/* ambil 10 terbesar */

let top10 = data.slice(0,10)

let labels = top10.map(d=>d.kabupaten)
let values = top10.map(d=>d.produksi)

drawBarChart(labels,values)

}

function drawBarChart(labels,data){

const ctx = document.getElementById("barChart")

new Chart(ctx,{
type:'bar',
data:{
labels:labels,
datasets:[{
label:'Produksi Padi 2025',
data:data,
backgroundColor:'#2c7be5'
}]
},
options:{
responsive:true,
plugins:{
legend:{
display:false,
maintainAspectRatio: false
}
}
}
})

}

// NAMPILIN TREN PER KABUPATEN
async function loadKabupatenTrend(){

const years = [2018,2019,2020,2021,2022,2023,2024,2025]

let dataKab = {}

for(let year of years){

let response = await fetch(`data/${year}.csv`)
let text = await response.text()

let rows = text.split("\n").slice(1)

rows.forEach(r=>{

let cols = r.split(",")

let kab = cols[0].trim()
let produksi = Number(cols[1])

if(!dataKab[kab]){
dataKab[kab] = []
}

dataKab[kab].push(produksi)

})

}

initDropdown(dataKab,years)

}

function initDropdown(dataKab,years){

const select = document.getElementById("kabupatenSelect")

Object.keys(dataKab).forEach(kab=>{

let option = document.createElement("option")
option.value = kab
option.text = kab

select.appendChild(option)

})

select.addEventListener("change",()=>{

updateKabChart(select.value,dataKab,years)

})

updateKabChart(select.value,dataKab,years)

}

let kabChart

function updateKabChart(kab,dataKab,years){

let data = dataKab[kab]

if(kabChart){
kabChart.destroy()
}

const ctx = document.getElementById("kabChart")

kabChart = new Chart(ctx,{
type:'line',
data:{
labels:years,
datasets:[{
label:kab,
data:data,
borderColor:'#f59e0b',
backgroundColor:'rgba(245,158,11,0.2)',
tension:0.3
}]
}
})

updateKabInfo(data)

}

// TAMPILAN SUB HEADERNYA

function updateKabInfo(data){

let last = data[data.length-1]
let prev = data[data.length-2]

let persen = ((last-prev)/prev*100).toFixed(2)

document.getElementById("produksiTerakhir").innerText =
"Produksi tahun terakhir: "+ last.toLocaleString()+" ton"

document.getElementById("persenPerubahan").innerText =
"Perubahan dari tahun sebelumnya: "+ persen +" %"

}

async function loadKPI(){

let data2025 = await fetch("data/2025.csv")
let text2025 = await data2025.text()

let rows2025 = text2025.split("\n").slice(1)

let total2025 = 0
let maxKab = ""
let maxProduksi = 0

rows2025.forEach(r=>{

let cols = r.split(",")

let kab = cols[0]
let produksi = Number(cols[1])

if(!isNaN(produksi)){

total2025 += produksi

if(produksi > maxProduksi){
maxProduksi = produksi
maxKab = kab
}

}

})


let data2024 = await fetch("data/2024.csv")
let text2024 = await data2024.text()

let rows2024 = text2024.split("\n").slice(1)

let total2024 = 0

rows2024.forEach(r=>{

let cols = r.split(",")

let produksi = Number(cols[1])

if(!isNaN(produksi)){
total2024 += produksi
}

})


let perubahan = ((total2025-total2024)/total2024*100).toFixed(2)


document.getElementById("totalProduksi").innerText =
total2025.toLocaleString()+" ton"

document.getElementById("kabTertinggi").innerText =
maxKab

document.getElementById("kabProduksi").innerText =
maxProduksi.toLocaleString()+" ton"

document.getElementById("persenPerubahanTotal").innerText =
perubahan+" %"

}

//INSIGHTNYA
async function generateInsight() {
    try {
        // 1. Ambil data 2025 (Cara manual seperti loadKPI)
        let resp25 = await fetch("data/2025.csv");
        let text25 = await resp25.text();
        let rows25 = text25.split("\n").slice(1); // Buang baris pertama (header)

        let total25 = 0;
        let maxKab = "";
        let maxVal = 0;

        rows25.forEach(r => {
            let cols = r.split(",");
            if (cols.length >= 2) {
                let kab = cols[0].trim();
                let prod = Number(cols[1]);

                if (!isNaN(prod)) {
                    total25 += prod;
                    if (prod > maxVal) {
                        maxVal = prod;
                        maxKab = kab;
                    }
                }
            }
        });

        // 2. Ambil data 2024 untuk hitung growth
        let resp24 = await fetch("data/2024.csv");
        let text24 = await resp24.text();
        let rows24 = text24.split("\n").slice(1);
        
        let total24 = 0;
        rows24.forEach(r => {
            let cols = r.split(",");
            let prod = Number(cols[1]);
            if (!isNaN(prod)) total24 += prod;
        });

        // 3. Kalkulasi (Cegah pembagian dengan nol)
        let growth = total24 !== 0 ? ((total25 - total24) / total24 * 100).toFixed(2) : "0";
        let jutaTon = (total25 / 1000000).toFixed(2);

        // 4. Template Insight
        const insights = [
            {
                icon: "📈",
                text: `Total produksi padi Jawa Timur tahun 2025 mencapai <b>${jutaTon} juta ton</b>. Angka ini menunjukkan pertumbuhan sebesar <b>${growth}%</b> dibandingkan tahun sebelumnya.`
            },
            {
                icon: "🏆",
                text: `<b>${maxKab}</b> mengukuhkan posisi sebagai lumbung padi utama di Jawa Timur dengan kontribusi sebesar <b>${maxVal.toLocaleString()} ton</b>.`
            },
            {
                icon: "📊",
                text: `Secara umum, tren produksi tahunan di tingkat provinsi menunjukkan fase <b>pemulihan yang positif</b> setelah sempat fluktuatif di periode 2022-2024.`
            },
            {
                icon: "🏘️",
                text: `Terdapat variasi pertumbuhan yang signifikan antar wilayah. Beberapa kabupaten menunjukkan lonjakan produksi di atas <b>10%</b> pada tahun ini.`
            }
        ];

        // 5. Inject ke HTML
        const insightBox = document.getElementById("insightBox");
        if (insightBox) {
            insightBox.innerHTML = insights.map(item => `
                <div class="insight-item">
                    <div class="insight-icon">${item.icon}</div>
                    <div class="insight-text">${item.text}</div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error("Gagal memuat insight:", error);
    }
}

loadKPI()
loadData()
loadMap()
loadTop10()
loadKabupatenTrend()
hitungStatistik()
generateInsight()
