const SUPABASE_URL = 'https://fgcysoitaztucsjyrvxe.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3lzb2l0YXp0dWNzanlydnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzNjYwNjIsImV4cCI6MjAzMzk0MjA2Mn0.SXrl_B22fCoyeh9hIU9pcpOV5lZtZpfUQGO920Hzzns';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

async function showProjetosRelatorio() {
    const { data: projetos, error: projetosError } = await supabase.from('projetos').select('*');
    if (projetosError) {
        console.error('Erro ao buscar projetos:', projetosError);
        return;
    }

    const relatorioContainer = document.getElementById('projetos-relatorio');
    relatorioContainer.innerHTML = '';

    for (const projeto of projetos) {
        const { data: atribuicoes, error: atribuicoesError } = await supabase
            .from('atribuicao')
            .select('horas')
            .eq('projeto', projeto.projeto);

        const { data: registros, error: registrosError } = await supabase
            .from('registro')
            .select('horas')
            .eq('projeto', projeto.projeto);

        if (atribuicoesError || registrosError) {
            console.error('Erro ao buscar atribuicoes ou registros:', atribuicoesError || registrosError);
            return;
        }

        const horasAtribuidas = atribuicoes.reduce((sum, atrib) => sum + atrib.horas, 0);
        const horasConcluidas = registros.reduce((sum, reg) => sum + reg.horas, 0);
        const faltaAtribuir = projeto.horas - horasAtribuidas;
        const progresso = (horasConcluidas / projeto.horas) * 100;

        const corBarra = progresso >= 100 ? 'green' : '#19e26d';

        const projetoRelatorio = `
            <div class="relatorio-item">
                <div>
                    <h3>${projeto.projeto}</h3>
                    <p>Data do Início: ${projeto.inicio}</p>
                    <p>Estimado: ${projeto.horas} horas</p>
                    <p>Horas Atribuídas: ${horasAtribuidas} horas</p>
                    <p>Falta Atribuir: ${faltaAtribuir} horas</p>
                    <p>Horas Concluídas: ${horasConcluidas} horas</p>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progresso}%; background-color: ${corBarra};">
                        ${progresso.toFixed(2)}%
                    </div>
                </div>
            </div>
        `;

        relatorioContainer.insertAdjacentHTML('beforeend', projetoRelatorio);
    }
}
