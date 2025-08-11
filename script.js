// Firebaseプロジェクトの設定情報
// ★★★ ユーザーから提供された設定情報に置き換え済み ★★★
const firebaseConfig = {
    apiKey: "AIzaSyBMmpRvHLrXwwyKGi6IH4IH8IQkE3fjH7w",
    authDomain: "ti-kimemo.firebaseapp.com",
    projectId: "ti-kimemo",
    storageBucket: "ti-kimemo.firebasestorage.app",
    messagingSenderId: "190739467226",
    appId: "1:190739467226:web:724ac64061484b92d58ee3",
    measurementId: "G-EY72HHJD1T"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const dashboardLoginButton = document.querySelector('.header .login-button');
    const dashboardLogoutButton = document.getElementById('logout-button');

    auth.onAuthStateChanged(user => {
        const path = window.location.pathname;

        if (user) {
            console.log("ユーザーがログインしています:", user.email);
            if (path.includes('index.html') || path.includes('register.html')) {
                window.location.href = 'dashboard.html';
            }
            if (dashboardLoginButton) {
                dashboardLoginButton.style.display = 'none';
            }
            if (dashboardLogoutButton) {
                dashboardLogoutButton.style.display = 'inline-flex';
            }
        } else {
            console.log("ユーザーはログアウトしています。");
            if (path.includes('dashboard.html')) {
                // ゲストモードではリダイレクトしない
            }
            if (dashboardLoginButton) {
                dashboardLoginButton.style.display = 'inline-flex';
            }
            if (dashboardLogoutButton) {
                dashboardLogoutButton.style.display = 'none';
            }
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
                alert(`ログインしました！`);
            } catch (error) {
                console.error("ログインエラー:", error);
                alert(`ログインに失敗しました: ${error.message}`);
            }
        });
    }

    if (registerForm) {
        const errorMessage = document.getElementById('error-message');
        const infoMessage = document.getElementById('info-message');
        
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (errorMessage) {
                errorMessage.textContent = '';
                errorMessage.style.display = 'none';
            }
            if (infoMessage) {
                infoMessage.style.display = 'none';
            }

            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;
            const agreeToTerms = registerForm.agreeToTerms.checked;
            
            if (password !== confirmPassword) {
                if (errorMessage) {
                    errorMessage.textContent = 'パスワードが一致しません。';
                    errorMessage.style.display = 'block';
                }
                return;
            }
            if (password.length < 6) {
                if (errorMessage) {
                    errorMessage.textContent = 'パスワードは6文字以上で入力してください。';
                    errorMessage.style.display = 'block';
                }
                return;
            }
            if (!agreeToTerms) {
                if (errorMessage) {
                    errorMessage.textContent = '利用規約とプライバシーポリシーへの同意が必要です。';
                    errorMessage.style.display = 'block';
                }
                return;
            }
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await db.collection('users').doc(userCredential.user.uid).set({
                    email: userCredential.user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                if (infoMessage) {
                    infoMessage.textContent = '登録が完了しました。ダッシュボードに移動します。';
                    infoMessage.style.display = 'block';
                }
                setTimeout(() => { /* onAuthStateChangedがリダイレクトを処理 */ }, 2000);
            } catch (error) {
                console.error("新規登録エラー:", error);
                if (errorMessage) {
                    errorMessage.textContent = `新規登録に失敗しました: ${error.message}`;
                    errorMessage.style.display = 'block';
                }
            }
        });
    }

    if (document.body.classList.contains('dashboard-page')) {
        updateStats();
        const reportButtons = document.querySelectorAll('.cta-button, .floating-button.primary');
        if (!auth.currentUser) {
            reportButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('投稿するにはログインが必要です。');
                    window.location.href = 'index.html';
                });
            });
        }
    }

    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            const reportMessage = document.getElementById('report-message');
            if (reportMessage) {
                reportMessage.style.display = 'none';
            }

            if (!user) {
                if (reportMessage) {
                    reportMessage.textContent = '投稿するにはログインが必要です。';
                    reportMessage.style.display = 'block';
                    reportMessage.classList.add('error-message');
                    reportMessage.classList.remove('info-message');
                }
                return;
            }

            const title = reportForm['report-title'].value;
            const type = reportForm['report-type'].value;
            const location = reportForm['report-location'].value;
            const description = reportForm['report-description'].value;

            try {
                await db.collection('reports').add({
                    title: title,
                    type: type,
                    location: location,
                    description: description,
                    reporter: user.uid,
                    reporterEmail: user.email,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                if (reportMessage) {
                    reportMessage.textContent = '危険情報を投稿しました。';
                    reportMessage.style.display = 'block';
                    reportMessage.classList.add('info-message');
                    reportMessage.classList.remove('error-message');
                }
                reportForm.reset();
            } catch (error) {
                console.error("投稿エラー:", error);
                if (reportMessage) {
                    reportMessage.textContent = `投稿に失敗しました: ${error.message}`;
                    reportMessage.style.display = 'block';
                    reportMessage.classList.add('error-message');
                    reportMessage.classList.remove('info-message');
                }
            }
        });
    }


    if (dashboardLogoutButton) {
        dashboardLogoutButton.addEventListener('click', async () => {
            try {
                await auth.signOut();
                alert('ログアウトしました。');
                window.location.href = 'index.html';
            } catch (error) {
                console.error("ログアウトエラー:", error);
                alert(`ログアウトに失敗しました: ${error.message}`);
            }
        });
    }
});

function updateStats() {
    const stats = {
        totalReports: Math.floor(Math.random() * 50) + 220,
        thisWeek: Math.floor(Math.random() * 10) + 8,
        activeUsers: Math.floor(Math.random() * 20) + 75,
        resolvedIssues: Math.floor(Math.random() * 30) + 140
    };
    Object.keys(stats).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = stats[key];
        }
    });
}
function reportDanger() {
    if (!auth.currentUser) {
        alert('危険を報告するにはログインが必要です。');
        window.location.href = 'index.html';
        return;
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            console.log('現在位置:', position.coords.latitude, position.coords.longitude);
            alert('危険情報の投稿画面を開きます\n現在位置: ' + position.coords.latitude.toFixed(4) + ', ' + position.coords.longitude.toFixed(4));
        }, function(error) {
            console.log('位置情報の取得に失敗:', error);
            alert('危険情報の投稿画面を開きます');
        });
    } else {
        alert('危険情報の投稿画面を開きます');
    }
}
function viewMap() {
    console.log('マップを表示します');
    alert('危険情報マップを表示します');
}
function openFullMap() {
    console.log('詳細マップを開きます');
    alert('詳細マップを表示します');
}
function filterByType(type) {
    console.log(`${type}の危険情報でフィルタリングします`);
    alert(`${type}の危険情報を表示します`);
}
function viewReport(reportId) {
    console.log(`報告 ${reportId} の詳細を表示します`);
    alert(`報告の詳細を表示します: ${reportId}`);
}