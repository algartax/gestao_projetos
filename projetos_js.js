const SUPABASE_URL = 'https://fgcysoitaztucsjyrvxe.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3lzb2l0YXp0dWNzanlydnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzNjYwNjIsImV4cCI6MjAzMzk0MjA2Mn0.SXrl_B22fCoyeh9hIU9pcpOV5lZtZpfUQGO920Hzzns';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

// Função para salvar dados de projetos
const formProjetos = document.getElementById('formProjetos');
if (formProjetos) {
    formProjetos.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const projeto = document.getElementById('nomeProjeto').value;
        const tipo = document.getElementById('tipoProjeto').value;
        const horas = document.getElementById('horasNecessarias').value;
        const status = document.getElementById('statusProjeto').value;
        const creditoEstimado = document.getElementById('creditoEstimado').value || null;
        const creditoRealizado = document.getElementById('creditoRealizado').value || null;
        const inicio = document.getElementById('inicioProjeto').value;
        const final = document.getElementById('finalProjeto').value;

        console.log('Dados a serem enviados para projetos:', { projeto, tipo, horas, status, creditoEstimado, creditoRealizado, inicio, final });

        const { data, error } = await supabase
            .from('projetos')
            .insert([{ projeto, tipo, horas, status, creditoEstimado, creditoRealizado, inicio, final }]);

        if (error) {
            console.error('Erro ao salvar os dados de projetos:', error);
            alert('Erro ao salvar os dados: ' + error.message);
        } else {
            console.log('Dados de projetos salvos com sucesso:', data);
            alert('Dados de projeto lançados com sucesso!');
            loadProjetosTable(); // Atualizar a tabela após salvar
        }
    });
}

// Função para carregar dados da tabela de projetos com filtro
async function loadProjetosTable(filter = "") {
    let query = supabase.from('projetos').select('*');
    if (filter) {
        query = query.ilike('projeto', `%${filter}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao carregar projetos: ', error);
        return;
    }

    const tableBody = document.getElementById('projetosTable').querySelector('tbody');
    tableBody.innerHTML = '';

    data.forEach(projeto => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td contenteditable="true" onBlur="updateProjeto(this, '${projeto.id}', 'projeto')">${projeto.projeto}</td>
            <td contenteditable="true" onBlur="updateProjeto(this, '${projeto.id}', 'horas')">${projeto.horas}</td>
            <td contenteditable="true" onBlur="updateProjeto(this, '${projeto.id}', 'inicio')">${projeto.inicio}</td>
            <td contenteditable="true" onBlur="updateProjeto(this, '${projeto.id}', 'final')">${projeto.final}</td>
            <td contenteditable="true" onBlur="updateProjeto(this, '${projeto.id}', 'status')">${projeto.status}</td>
            <td contenteditable="true" onBlur="updateProjeto(this, '${projeto.id}', 'creditoEstimado')">${projeto.creditoEstimado}</td>
            <td contenteditable="true" onBlur="updateProjeto(this, '${projeto.id}', 'creditoRealizado')">${projeto.creditoRealizado}</td>
            <td><button onclick="confirmDelete(${projeto.id})">❌</button></td>
        `;


        tableBody.appendChild(row);
    });
}

// Função para atualizar dados do projeto
async function updateProjeto(element, id, column) {
    const value = element.textContent;
    const { data, error } = await supabase
        .from('projetos')
        .update({ [column]: value })
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar projeto:', error);
        alert('Erro ao atualizar projeto: ' + error.message);
    } else {
        console.log('Projeto atualizado com sucesso:', data);
    }
}

// Função para confirmar exclusão de projeto
function confirmDelete(id) {
    if (confirm("Deseja realmente finalizar/excluir este projeto?")) {
        deleteProjeto(id);
    }
}

// Função para excluir projeto e mover para a tabela finalizados
async function deleteProjeto(id) {
    const { data: projeto, error: fetchError } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError) {
        console.error('Erro ao buscar projeto:', fetchError);
        alert('Erro ao buscar projeto: ' + fetchError.message);
        return;
    }

    const { error: insertError } = await supabase
        .from('finalizados')
        .insert([projeto]);

    if (insertError) {
        console.error('Erro ao mover projeto para finalizados:', insertError);
        alert('Erro ao mover projeto para finalizados: ' + insertError.message);
        return;
    }

    const { error: deleteError } = await supabase
        .from('projetos')
        .delete()
        .eq('id', id);

    if (deleteError) {
        console.error('Erro ao excluir projeto:', deleteError);
        alert('Erro ao excluir projeto: ' + deleteError.message);
    } else {
        console.log('Projeto movido para finalizados e excluído com sucesso');
        loadProjetosTable();
    }
}

// Função para exportar dados para Excel
async function exportToExcel() {
    const { data: projetos, error: errorProjetos } = await supabase
        .from('projetos')
        .select('*');

    const { data: finalizados, error: errorFinalizados } = await supabase
        .from('finalizados')
        .select('*');

    if (errorProjetos || errorFinalizados) {
        console.error('Erro ao carregar dados para exportação:', errorProjetos || errorFinalizados);
        alert('Erro ao carregar dados para exportação');
        return;
    }

    const workbook = XLSX.utils.book_new();

    const projetosSheet = XLSX.utils.json_to_sheet(projetos);
    XLSX.utils.book_append_sheet(workbook, projetosSheet, 'Projetos');

    const finalizadosSheet = XLSX.utils.json_to_sheet(finalizados);
    XLSX.utils.book_append_sheet(workbook, finalizadosSheet, 'Finalizados');

    XLSX.writeFile(workbook, 'Projetos_e_Finalizados.xlsx');
}

// Filtro de pesquisa para a tabela de projetos
document.getElementById('filterInput').addEventListener('input', (e) => {
    const filterValue = e.target.value;
    loadProjetosTable(filterValue); // Atualiza a tabela conforme o filtro
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadProjetosTable();
});
