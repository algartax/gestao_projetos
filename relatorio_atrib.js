const SUPABASE_URL = 'https://fgcysoitaztucsjyrvxe.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3lzb2l0YXp0dWNzanlydnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzNjYwNjIsImV4cCI6MjAzMzk0MjA2Mn0.SXrl_B22fCoyeh9hIU9pcpOV5lZtZpfUQGO920Hzzns';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

async function filtrarAno() {
    const ano = document.getElementById('anoSelect').value;
    const { data, error } = await supabase
        .from('atribuicao')
        .select('*')
        .eq('ano', ano);

    if (error) {
        console.error('Erro ao buscar dados:', error);
        return;
    }

    // Normalizar nomes de analistas e projetos
    data.forEach(item => {
        item.analista = item.analista.trim().toUpperCase().replace(/\s+/g, ' ');
        item.projeto = item.projeto.trim().toUpperCase().replace(/\s+/g, ' ');
    });

    const analistas = [...new Set(data.map(item => item.analista))];
    const tabelaCorpo = document.querySelector('#atribTable tbody');
    tabelaCorpo.innerHTML = '';

    analistas.forEach(analista => {
        const projetosDoAnalista = data.filter(item => item.analista === analista);
        const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        const linhaAnalista = document.createElement('tr');
        linhaAnalista.classList.add('analyst-row'); // Adiciona a classe analyst-row
        linhaAnalista.innerHTML = `
            <td><button class="expand-button" onclick="toggleProjects('${analista.replace(/\s+/g, '')}')">+</button></td>
            <td>${analista}</td>`;
        let totalAnalista = 0;
        meses.forEach(mes => {
            const horasMes = projetosDoAnalista
                .filter(projeto => projeto.mes.toLowerCase() === mes)
                .reduce((acc, projeto) => acc + projeto.horas, 0);
            totalAnalista += horasMes;
            linhaAnalista.innerHTML += `<td>${horasMes}</td>`;
        });
        linhaAnalista.innerHTML += `<td>${totalAnalista}</td>`;
        tabelaCorpo.appendChild(linhaAnalista);

        const projetosAgrupados = {};
        projetosDoAnalista.forEach(projeto => {
            if (!projetosAgrupados[projeto.projeto]) {
                projetosAgrupados[projeto.projeto] = { ...projeto, horas: Array(12).fill(0) };
            }
            const mesIndex = meses.indexOf(projeto.mes.toLowerCase());
            projetosAgrupados[projeto.projeto].horas[mesIndex] += projeto.horas;
        });

        Object.values(projetosAgrupados).forEach(projetoAgrupado => {
            const linhaProjeto = document.createElement('tr');
            linhaProjeto.classList.add('project-row', analista.replace(/\s+/g, ''));
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
});
