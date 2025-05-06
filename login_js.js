const SUPABASE_URL = 'https://fgcysoitaztucsjyrvxe.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3lzb2l0YXp0dWNzanlydnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzNjYwNjIsImV4cCI6MjAzMzk0MjA2Mn0.SXrl_B22fCoyeh9hIU9pcpOV5lZtZpfUQGO920Hzzns';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { user, error } = await supabase.auth.signIn({ email, password });

    const messageElement = document.getElementById('message');

    if (error) {
        console.error('Erro ao fazer login:', error);
        messageElement.textContent = 'Email ou senha incorretos. Tente novamente.';
    } else {
        console.log('Login bem-sucedido:', user);
        messageElement.textContent = '';
        localStorage.setItem('userEmail', email);
        window.location.href = 'registro.html';
    }
});

document.getElementById('changePasswordButton').addEventListener('click', function () {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('changePasswordForm').style.display = 'block';
});

document.getElementById('cancelChangePassword').addEventListener('click', function () {
    document.getElementById('changePasswordForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

document.getElementById('changePasswordForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    const email = localStorage.getItem('userEmail');
    const messageElement = document.getElementById('message');

    if (newPassword !== confirmNewPassword) {
        messageElement.textContent = 'A nova senha e a confirmação não correspondem.';
        return;
    }

    const { error: signInError } = await supabase.auth.signIn({ email, password: currentPassword });

    if (signInError) {
        console.error('Erro ao verificar senha atual:', signInError);
        messageElement.textContent = 'Senha atual incorreta. Tente novamente.';
    } else {
        const { error: updateError } = await supabase.auth.update({ password: newPassword });

        if (updateError) {
            console.error('Erro ao mudar senha:', updateError);
            messageElement.textContent = 'Erro ao mudar senha. Tente novamente.';
        } else {
            messageElement.textContent = 'Senha alterada com sucesso. Faça login novamente.';
            document.getElementById('changePasswordForm').reset();
            document.getElementById('changePasswordForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        }
    }
});
