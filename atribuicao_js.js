const SUPABASE_URL = 'https://fgcysoitaztucsjyrvxe.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3lzb2l0YXp0dWNzanlydnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzNjYwNjIsImV4cCI6MjAzMzk0MjA2Mn0.SXrl_B22fCoyeh9hIU9pcpOV5lZtZpfUQGO920Hzzns';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

// Função para salvar dados de atribuição
const formAtribuicao = document.getElementById('formAtribuicao');
if (formAtribuicao) {
    formAtribuicao.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const nomeAnalista = document.getElementById('nomeAnalista').value;
        const nomeProjeto = document.getElementById('nomeProjeto').value;
        const horasAtribuidas = parseFloat(document.getElementById('horasAtribuidas').value);
        const mes = document.getElementById('mes').value;
        const ano = parseInt(document.getElementById('ano').value, 10);

        console.log('Dados a serem enviados para atribuição:', { analista: nomeAnalista, projeto: nomeProjeto, horas: horasAtribuidas, mes, ano });

        const { data: result, error } = await supabase
            .from('atribuicao')
            .insert([{ analista: nomeAnalista, projeto: nomeProjeto, horas: horasAtribuidas, mes, ano }]);

        if (error) {
            console.error('Erro ao salvar os dados de atribuição:', error);
            alert('Erro ao salvar os dados: ' + error.message);
        } else {
            console.log('Dados de atribuição salvos com sucesso:', result);
            alert('Dados de atribuição lançados com sucesso!');
            formAtribuicao.reset();
            loadAtribuicoesTable(); // Atualizar a tabela após salvar
        }
    });

    document.addEventListener('DOMContentLoaded', async () => {
        await loadSelectOptions('analistas', 'nome', 'nomeAnalista');
        await loadSelectOptions('analistas', 'nome', 'filterAnalista');
        await loadSelectOptions('projetos', 'projeto', 'nomeProjeto');
        await loadSelectOptions('projetos', 'projeto', 'filterProjeto');
        await loadAtribuicoesTable();
    });
}

// Função para carregar dados da tabela de atribuição
async function loadAtribuicoesTable() {
    const { data, error } = await supabase.from('atribuicao').select('*');

    if (error) {
        console.error('Erro ao carregar atribuições: ', error);
        return;
    }

    // Ordenar os dados em ordem decrescente
    data.sort((a, b) => b.id - a.id);

    const tableBody = document.getElementById('atribuicaoTable').querySelector('tbody');
    tableBody.innerHTML = '';

    data.forEach(atribuicao => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${atribuicao.analista}</td>
            <td>${atribuicao.projeto}</td>
            <td>${atribuicao.horas}</td>
            <td>${atribuicao.mes}</td>
            <td>${atribuicao.ano}</td>
            <td><button onclick="confirmDelete(${atribuicao.id})">🗑️</button></td>
        `;

        tableBody.appendChild(row);
    });

    applyFilters(); // Aplicar os filtros ao carregar a tabela
}

// Função para confirmar exclusão de atribuição
function confirmDelete(id) {
    if (confirm("Deseja realmente excluir esta atribuição?")) {
        deleteAtribuicao(id);
    }
}

// Função para excluir atribuição
async function deleteAtribuicao(id) {
    const { error } = await supabase
        .from('atribuicao')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir atribuição:', error);
        alert('Erro ao excluir atribuição: ' + error.message);
    } else {
        console.log('Atribuição excluída com sucesso');
        loadAtribuicoesTable();
    }
}

// Função para exportar dados para Excel
async function exportToExcel() {
    const { data, error } = await supabase
        .from('atribuicao')
        .select('*');

    if (error) {
        console.error('Erro ao carregar dados para exportação:', error);
        alert('Erro ao carregar dados para exportação');
        return;
    }

    const workbook = XLSX.utils.book_new();

    const atribuicaoSheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, atribuicaoSheet, 'Atribuição');

    XLSX.writeFile(workbook, 'Atribuicao.xlsx');
}

// Função para carregar opções em um select
async function loadSelectOptions(tableName, columnName, selectId) {
    const { data, error } = await supabase.from(tableName).select(columnName);

    if (error) {
        console.error('Erro ao carregar opções: ', error);
        return;
    }

    // Ordenar os dados pelo nome do projeto (ou analista)
    data.sort((a, b) => a[columnName].localeCompare(b[columnName]));

    const selectElement = document.getElementById(selectId);
    if (selectElement) {
        // Limpa as opções existentes
        selectElement.innerHTML = '<option value="">Selecione...</option>';
        
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[columnName];
            option.textContent = item[columnName];
            selectElement.appendChild(option);
        });
    } else {
        console.error(`Elemento select com id ${selectId} não encontrado.`);
    }
}

// Função para aplicar filtros na tabela
function applyFilters() {
    const filterAnalista = document.getElementById('filterAnalista').value.toLowerCase();
    const filterProjeto = document.getElementById('filterProjeto').value.toLowerCase();
    const filterMes = document.getElementById('filterMes').value.toLowerCase();
    const filterAno = document.getElementById('filterAno').value.toLowerCase();

    const rows = document.querySelectorAll('#atribuicaoTable tbody tr');

    let totalHoras = 0;

    rows.forEach(row => {
        const analista = row.cells[0].textContent.toLowerCase();
        const projeto = row.cells[1].textContent.toLowerCase();
        const horas = parseFloat(row.cells[2].textContent);
        const mes = row.cells[3].textContent.toLowerCase();
        const ano = row.cells[4].textContent.toLowerCase();

        const matchesAnalista = !filterAnalista || analista.includes(filterAnalista);
        const matchesProjeto = !filterProjeto || projeto.includes(filterProjeto);
        const matchesMes = !filterMes || mes.includes(filterMes);
        const matchesAno = !filterAno || ano.includes(filterAno);

        if (matchesAnalista && matchesProjeto && matchesMes && matchesAno) {
            row.style.display = '';
            totalHoras += horas;
        } else {
            row.style.display = 'none';
        }
    });

    document.getElementById('totalHoras').textContent = totalHoras.toFixed(2);
}

// Função para verificar as horas permitidas
async function checkHours() {
    const mesMap = {
        janeiro: 1,
        fevereiro: 2,
        marco: 3,
        abril: 4,
        maio: 5,
        junho: 6,
        julho: 7,
        agosto: 8,
        setembro: 9,
        outubro: 10,
        novembro: 11,
        dezembro: 12
    };

    const mes = document.getElementById('mes').value.toLowerCase();
    const ano = document.getElementById('ano').value;

    if (mes && ano) {
        const mesNumero = mesMap[mes];

        const { data, error } = await supabase
            .from('horas')
            .select('hora')
            .eq('mes', mesNumero)
            .eq('ano', parseInt(ano));

        if (error) {
            console.error('Erro ao carregar horas permitidas:', error);
            return;
        }

        if (data && data.length > 0) {
            const horasPermitidas = data[0].hora;
            document.getElementById('hoursMessage').textContent = `NESSE MÊS VOCÊ PODE ATRIBUIR APENAS ${horasPermitidas} HORAS`;
            showModal();
        } else {
            console.warn('Nenhuma hora permitida encontrada para o mês e ano fornecidos.');
        }
    } else {
        console.warn('Mês e ano não fornecidos para a verificação de horas.');
    }
}

function showModal() {
    const modal = document.getElementById('hoursModal');
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('hoursModal');
    modal.style.display = 'none';
}

document.getElementById('filterAnalista').addEventListener('input', applyFilters);
document.getElementById('filterProjeto').addEventListener('input', applyFilters);
document.getElementById('filterMes').addEventListener('input', applyFilters);
document.getElementById('filterAno').addEventListener('input', applyFilters);
