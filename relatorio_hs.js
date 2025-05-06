const SUPABASE_URL = 'https://fgcysoitaztucsjyrvxe.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3lzb2l0YXp0dWNzanlydnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzNjYwNjIsImV4cCI6MjAzMzk0MjA2Mn0.SXrl_B22fCoyeh9hIU9pcpOV5lZtZpfUQGO920Hzzns';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

async function fetchAllData() {
    let allData = [];
    let start = 0;
    const pageSize = 1000;
    let moreData = true;

    while (moreData) {
        const { data, error } = await supabase
            .from('registro')
            .select('*')
            .range(start, start + pageSize - 1);

        if (error) {
            console.error('Erro ao buscar dados:', error);
            moreData = false;
            continue;
        }

        allData = allData.concat(data);
        start += pageSize;

        if (data.length < pageSize) {
            moreData = false;
        }
    }

    return allData;
}

function normalizeClassName(name) {
    return name ? name.replace(/\s+/g, '_') : 'unknown';
}

async function filtrarAno() {
    const anoSelect = document.getElementById('anoSelect');
    if (!anoSelect) {
        console.error('Elemento anoSelect não encontrado');
        return;
    }
    const ano = anoSelect.value;

    const data = await fetchAllData();
    const dadosFiltrados = data.filter(item => {
        const dataItem = new Date(item.data);
        return dataItem.getFullYear().toString() === ano && item.analista; // Inclui apenas registros com analista preenchido
    });

    if (dadosFiltrados.length === 0) {
        console.warn('Nenhum dado encontrado para o ano selecionado:', ano);
        return;
    }

    console.log('Dados retornados após filtro de ano:', dadosFiltrados);

    const tabelaCorpo = document.querySelector('#atribTable tbody');
    if (!tabelaCorpo) {
        console.error('Elemento tbody não encontrado');
        return;
    }
    tabelaCorpo.innerHTML = '';

    // Processa os dados dos analistas e projetos
    const analistas = [...new Set(dadosFiltrados.map(item => item.analista))];

    analistas.forEach(analista => {
        const registrosDoAnalista = dadosFiltrados.filter(item => item.analista === analista);
        const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        const linhaAnalista = document.createElement('tr');
        linhaAnalista.classList.add('analyst-row');
        const analistaClass = normalizeClassName(analista);
        linhaAnalista.innerHTML = `
            <td><button class="expand-button" onclick="toggleProjects('${analistaClass}')">+</button></td>
            <td>${analista}</td>`;
        let totalAnalista = 0;
        meses.forEach((mes, index) => {
            const horasMes = registrosDoAnalista
                .filter(registro => new Date(registro.data).getMonth() === index)
                .reduce((acc, registro) => acc + registro.horas, 0);
            totalAnalista += horasMes;
            linhaAnalista.innerHTML += `<td>${horasMes}</td>`;
        });
        linhaAnalista.innerHTML += `<td>${totalAnalista}</td>`;
        tabelaCorpo.appendChild(linhaAnalista);

        const projetosAgrupados = {};
        registrosDoAnalista.forEach(registro => {
            const projetoClass = normalizeClassName(registro.projeto);
            if (!projetosAgrupados[registro.projeto]) {
                projetosAgrupados[registro.projeto] = { ...registro, horas: Array(12).fill(0) };
            }
            const mesIndex = new Date(registro.data).getMonth();
            projetosAgrupados[registro.projeto].horas[mesIndex] += registro.horas;
        });

        Object.values(projetosAgrupados).forEach(projetoAgrupado => {
            const linhaProjeto = document.createElement('tr');
            linhaProjeto.classList.add('project-row', analistaClass);
            let totalProjeto = 0;
            linhaProjeto.innerHTML = `
                <td></td>
                <td>${projetoAgrupado.projeto}</td>`;
            projetoAgrupado.horas.forEach(horasMes => {
                totalProjeto += horasMes;
                linhaProjeto.innerHTML += `<td>${horasMes}</td>`;
            });
            linhaProjeto.innerHTML += `<td>${totalProjeto}</td>`;
            tabelaCorpo.appendChild(linhaProjeto);
        });
    });
}

function toggleProjects(analista) {
    const rows = document.querySelectorAll(`.${analista}`);
    rows.forEach(row => {
        row.style.display = (row.style.display === 'table-row') ? 'none' : 'table-row';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    filtrarAno();
    const anoSelect = document.getElementById('anoSelect');
    if (anoSelect) {
        anoSelect.addEventListener('change', filtrarAno);
    } else {
        console.error('Elemento anoSelect não encontrado');
    }
});
