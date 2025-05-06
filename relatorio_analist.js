const SUPABASE_URL = 'https://fgcysoitaztucsjyrvxe.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3lzb2l0YXp0dWNzanlydnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzNjYwNjIsImV4cCI6MjAzMzk0MjA2Mn0.SXrl_B22fCoyeh9hIU9pcpOV5lZtZpfUQGO920Hzzns';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

const horasPorMesAno = [
    { ano: 2025, mes: 'Janeiro', hora: 176 },
    // ... demais meses e anos ...
];

let barChart, doughnutChart;

async function loadUserInfo() {
    const email = localStorage.getItem('userEmail');
    if (!email) {
        console.error('Usuário não está logado');
        return;
    }

    const { data, error } = await supabase
        .from('analistas')
        .select('nome')
        .ilike('email', `%${email.trim()}%`)
        .single();

    if (error) {
        console.error('Erro ao carregar informações do usuário:', error.message);
        return;
    }

    if (data) {
        document.getElementById('analistaSelect').value = data.nome.toUpperCase(); // Converte para maiúsculas
    } else {
        console.warn('Nome do usuário não encontrado no Supabase.');
    }
}

async function filtrarDados() {
    const analista = document.getElementById('analistaSelect').value.trim().toUpperCase();
    const mes = document.getElementById('mesSelect').value;
    const ano = document.getElementById('anoSelect').value;

    // Chamada inicial do Supabase com filtro direto por analista
    let { data, error } = await supabase
        .from('registro')
        .select('*')
        .ilike('analista', `%${analista}%`); // Filtro direto no Supabase

    console.log("Dados recebidos do Supabase (após filtro por analista):", data); // Verificar se está trazendo o analista correto
    if (error) {
        console.error('Erro ao buscar dados:', error.message);
        return;
    }

    // Aplicar o filtro de mês e ano se necessário
    if (mes) {
        data = data.filter(item => {
            const dataItem = new Date(item.data + 'T00:00:00');
            return dataItem.getMonth() + 1 === parseInt(mes);
        });
        console.log("Dados após filtro de mês:", data); // Verificar o resultado do filtro de mês
    }

    if (ano) {
        data = data.filter(item => {
            const dataItem = new Date(item.data + 'T00:00:00');
            return dataItem.getFullYear() === parseInt(ano);
        });
        console.log("Dados após filtro de ano:", data); // Verificar o resultado do filtro de ano
    }

    if (data.length === 0) {
        console.warn('Nenhum dado encontrado para os filtros selecionados.');
    }

    // Continue com o restante do processamento dos dados
    const projetos = [...new Set(data.map(item => item.projeto))];
    const horasPorProjeto = projetos.map(projeto => {
        return data.filter(item => item.projeto === projeto)
                   .reduce((total, item) => total + item.horas, 0);
    });

    const totalHorasTrabalhadas = horasPorProjeto.reduce((total, horas) => total + horas, 0);

    let horasEsperadas = 170; // Valor padrão se não houver filtro de mês e ano
    if (mes && ano) {
        const mesNome = getMonthName(mes);
        const horasData = horasPorMesAno.find(h => h.ano === parseInt(ano) && h.mes === mesNome);
        if (horasData) {
            horasEsperadas = horasData.hora;
        }
    }
    const horasRestantes = horasEsperadas - totalHorasTrabalhadas;

    renderBarChart(projetos, horasPorProjeto);
    renderDoughnutChart(totalHorasTrabalhadas, horasRestantes, horasEsperadas);
}

// Função auxiliar para obter o nome do mês
function getMonthName(monthNumber) {
    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[monthNumber - 1];
}

function renderBarChart(projetos, horasPorProjeto) {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChart) {
        barChart.destroy();
    }
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: projetos,
            datasets: [{
                label: 'Horas Trabalhadas',
                data: horasPorProjeto,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    formatter: (value) => `${value}h`,
                    color: '#000',
                    font: {
                        weight: 'bold'
                    }
                }
            },
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true
                }
            },
            maintainAspectRatio: false,
        },
        plugins: [ChartDataLabels]
    });
}

function renderDoughnutChart(totalHorasTrabalhadas, horasRestantes, horasEsperadas) {
    const ctx = document.getElementById('doughnutChart').getContext('2d');
    if (doughnutChart) {
        doughnutChart.destroy();
    }
    doughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Horas Trabalhadas', 'Horas Restantes'],
            datasets: [{
                data: [totalHorasTrabalhadas, horasRestantes],
                backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 193, 7, 0.2)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 193, 7, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    formatter: (value) => `${value}h`,
                    color: '#000',
                    font: {
                        weight: 'bold'
                    }
                }
            },
            title: {
                display: true,
                text: `Horas Esperadas: ${horasEsperadas}h`
            },
            maintainAspectRatio: false,
        },
        plugins: [ChartDataLabels]
    });
}

async function verificarDatasFaltantes() {
    const hoje = new Date();
    const dataInicio = new Date('2024-06-01');

    const analista = document.getElementById('analistaSelect').value.trim().toUpperCase();

    let { data: registros, error: errorRegistros } = await supabase
        .from('registro')
        .select('data')
        .ilike('analista', `%${analista}%`);

    if (errorRegistros) {
        console.error('Erro ao buscar registros:', errorRegistros.message);
        return;
    }

    let { data: datasVerificadas, error: errorVerificao } = await supabase
        .from('verificao')
        .select('data');

    if (errorVerificao) {
        console.error('Erro ao buscar dados de verificação:', errorVerificao.message);
        return;
    }

    const datasRegistradas = registros.map(item => item.data);
    const datasVerificadasSet = new Set(datasVerificadas.map(item => item.data));
    const datasFaltantes = [];

    for (let dia = hoje; dia >= dataInicio; dia.setDate(dia.getDate() - 1)) {
        const diaSemana = dia.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
            const dataFormatada = dia.toISOString().split('T')[0];
            if (!datasRegistradas.includes(dataFormatada) && !datasVerificadasSet.has(dataFormatada)) {
                datasFaltantes.push(dataFormatada);
            }
        }
    }

    const tableBody = document.querySelector('#missingDatesTable tbody');
    tableBody.innerHTML = '';

    datasFaltantes.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data}</td>
            <td><button class="check-button" onclick="marcarAvisado('${data}')">✔️</button></td>
        `;
        tableBody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await filtrarDados();
    await verificarDatasFaltantes();

    document.getElementById('mesSelect').addEventListener('change', filtrarDados);
    document.getElementById('anoSelect').addEventListener('change', filtrarDados);
});
