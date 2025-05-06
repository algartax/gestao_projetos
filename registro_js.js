const SUPABASE_URL = 'https://fgcysoitaztucsjyrvxe.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3lzb2l0YXp0dWNzanlydnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzNjYwNjIsImV4cCI6MjAzMzk0MjA2Mn0.SXrl_B22fCoyeh9hIU9pcpOV5lZtZpfUQGO920Hzzns';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

// Função para carregar e ordenar os projetos em ordem alfabética
async function loadSelectOptions(tableName, columnName, selectId) {
    const { data, error } = await supabase.from(tableName).select(columnName);

    if (error) {
        console.error('Erro ao carregar opções: ', error);
        return;
    }

    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = '<option value=""></option>';

    // Ordena os dados do projeto em ordem alfabética pelo nome
    data.sort((a, b) => a[columnName].localeCompare(b[columnName]));

    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[columnName];
        option.textContent = item[columnName];
        selectElement.appendChild(option);
    });
}

async function loadUserInfo() {
    const email = localStorage.getItem('userEmail');
    if (!email) {
        console.error('Usuário não está logado');
        return;
    }
    const { data, error } = await supabase
        .from('analistas')
        .select('nome, nivel')
        .eq('email', email)
        .single();
    if (error) {
        console.error('Erro ao carregar informações do usuário:', error);
        return;
    }
    document.getElementById('nomeAnalista').value = data.nome;
    document.querySelector('.back-button').style.display = data.nivel === 'admin' ? 'block' : 'none';
}

// Função para carregar a lista de analistas
async function loadAnalistas() {
    const { data: analistas, error } = await supabase.from('analistas').select('id, nome');
    if (error) {
        console.error("Erro ao carregar analistas:", error);
        return;
    }

    const selectAnalista = document.getElementById("nomeAnalista");
    analistas.forEach(analista => {
        const option = document.createElement("option");
        option.value = analista.id;
        option.textContent = analista.nome;
        selectAnalista.appendChild(option);
    });
}

const formRegistro = document.getElementById('formRegistro');
if (formRegistro) {
    formRegistro.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const data = document.getElementById('data').value;
        const analista = document.getElementById('nomeAnalista').value;
        const projeto = document.getElementById('nomeProjeto').value;
        const horas = document.getElementById('horasGastas').value;

        const { data: result, error } = await supabase
            .from('registro')
            .insert([{ data, analista, projeto, horas }]);

        if (error) {
            console.error('Erro ao salvar os dados de registro:', error);
            alert('Erro ao salvar os dados: ' + error.message);
        } else {
            alert('Dados de registro lançados com sucesso!');
            loadRegistros();
        }
    });

    document.addEventListener('DOMContentLoaded', async () => {
        await loadUserInfo();
        await loadAnalistas();
        await loadSelectOptions('projetos', 'projeto', 'nomeProjeto');  // Carrega e ordena projetos
        await loadRegistros();
    });
}

async function loadRegistros() {
    const analista = document.getElementById('nomeAnalista').value;
    const { data, error } = await supabase
        .from('registro')
        .select('*')
        .eq('analista', analista)
        .order('data', { ascending: false });

    if (error) {
        console.error('Erro ao carregar registros:', error);
        return;
    }

    const tableBody = document.getElementById('registrosTable').querySelector('tbody');
    tableBody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.data.split('-').reverse().join('/')}</td>
            <td>${item.analista}</td>
            <td>${item.projeto}</td>
            <td>${item.horas}</td>
            <td><button onclick="deleteRegistro(${item.id})">🗑️</button></td>
        `;
        tableBody.appendChild(row);
    });
}

async function deleteRegistro(id) {
    const { error } = await supabase.from('registro').delete().eq('id', id);
    if (error) {
        console.error('Erro ao excluir registro:', error);
        alert('Erro ao excluir registro');
    } else {
        alert('Registro excluído com sucesso');
        loadRegistros();
    }
}

async function applyDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const analista = document.getElementById('nomeAnalista').value;

    let query = supabase.from('registro').select('*').eq('analista', analista);

    if (startDate) {
        query = query.gte('data', startDate);
    }
    if (endDate) {
        query = query.lte('data', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao aplicar filtro de datas:', error);
        alert('Erro ao aplicar filtro de datas: ' + error.message);
        return;
    }

    const tableBody = document.getElementById('registrosTable').querySelector('tbody');
    tableBody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.data.split('-').reverse().join('/')}</td>
            <td>${item.analista}</td>
            <td>${item.projeto}</td>
            <td>${item.horas}</td>
            <td><button onclick="deleteRegistro(${item.id})">🗑️</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function clearDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    loadRegistros();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadAnalistas();
    await loadSelectOptions('projetos', 'projeto', 'nomeProjeto'); // Carrega e ordena projetos
    await loadRegistros();

    document.getElementById('startDate').addEventListener('change', applyDateFilter);
    document.getElementById('endDate').addEventListener('change', applyDateFilter);
});
