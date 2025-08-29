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

// ダッシュボードの統計データをFirebaseから取得・更新する非同期関数
async function updateStatsFromFirebase() {
    try {
        // 総投稿数を取得
        const totalReportsSnapshot = await db.collection('reports').get();
        const totalReportsCount = totalReportsSnapshot.size;
        const totalReportsElement = document.getElementById('totalReports');
        if (totalReportsElement) {
            totalReportsElement.textContent = totalReportsCount;
        }

        // 今週の投稿数を取得
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeekReportsSnapshot = await db.collection('reports')
            .where('timestamp', '>=', oneWeekAgo)
            .get();
        const thisWeekCount = thisWeekReportsSnapshot.size;
        const thisWeekElement = document.getElementById('thisWeek');
        if (thisWeekElement) {
            thisWeekElement.textContent = thisWeekCount;
        }

        // アクティブユーザー数を取得
        const usersSnapshot = await db.collection('users').get();
        const activeUsersCount = usersSnapshot.size;
        const activeUsersElement = document.getElementById('activeUsers');
        if (activeUsersElement) {
            activeUsersElement.textContent = activeUsersCount;
        }

        // 解決済み件数を取得（reportsコレクションにstatus: "resolved"フィールドが必要です）
        const resolvedIssuesSnapshot = await db.collection('reports')
            .where('status', '==', 'resolved')
            .get();
        const resolvedIssuesCount = resolvedIssuesSnapshot.size;
        const resolvedIssuesElement = document.getElementById('resolvedIssues');
        if (resolvedIssuesElement) {
            resolvedIssuesElement.textContent = resolvedIssuesCount;
        }

    } catch (error) {
        console.error("統計データの取得エラー:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const dashboardLoginButton = document.getElementById('dashboard-login-button');
    const accountAvatar = document.getElementById('account-avatar');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const dashboardLogoutButton = document.getElementById('logout-button');
    const googleLoginBtn = document.getElementById('google-login-btn');

    // ダッシュボードページなら初期表示を必ず「ログイン表示・ログアウト非表示」にする
    if (dashboardLoginButton && document.body.classList.contains('dashboard-page')) {
        dashboardLoginButton.style.display = 'inline-flex';
    }
    if (accountAvatar && document.body.classList.contains('dashboard-page')) {
        accountAvatar.style.display = 'none';
    }

    // 投稿ボタンの挙動をログイン状態に応じて切り替える
    function setupReportButtons(user) {
        const reportButtons = document.querySelectorAll('.cta-button, .floating-button.primary');
        reportButtons.forEach(button => {
            button.onclick = function(e) {
                e.preventDefault();
                if (!user) {
                    showDialog('投稿するにはログインが必要です。');
                    window.location.href = 'index.html';
                } else {
                    showDialog('投稿画面に移行します');
                    setTimeout(() => {
                        window.location.href = 'report.html';
                    }, 600); // ダイアログを少し表示してから遷移
                }
            };
        });
    }

    auth.onAuthStateChanged(user => {
        const isLoginPage = location.pathname.endsWith('index.html');
        const isDashboardPage = location.pathname.endsWith('dashboard.html');

        // ログイン画面でログイン済みの場合のみダッシュボードに遷移
        if (user && isLoginPage) {
            window.location.href = 'dashboard.html';
            return; // 以降の表示制御は不要
        }

        if (user) {
            console.log("ユーザーがログインしています:", user.email);
            if (dashboardLoginButton && isDashboardPage) {
                dashboardLoginButton.style.display = 'none';
            }
            if (accountAvatar && isDashboardPage) {
                userAvatarImg.src = user.photoURL || 'https://www.gravatar.com/avatar?d=mp';
                accountAvatar.style.display = 'inline-flex';
            }
        } else {
            console.log("ユーザーはログアウトしています。");
            if (dashboardLoginButton && isDashboardPage) {
                dashboardLoginButton.style.display = 'inline-flex';
            }
            if (accountAvatar && isDashboardPage) {
                accountAvatar.style.display = 'none';
                userAvatarImg.src = '';
            }
        }
        setupReportButtons(user);
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
                // ログイン成功時に即座にダッシュボードへ遷移
                window.location.href = 'dashboard.html';
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
                // 2秒後にダッシュボードへ遷移
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
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
        // ダッシュボードページではFirebaseから統計データを取得
        updateStatsFromFirebase();
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

            const type = reportForm['report-type'].value;
            const location = reportForm['report-location'].value;
            const description = reportForm['report-description'].value;

            try {
                await db.collection('reports').add({
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

    // アカウント画像クリックでアカウント情報画面へ
    if (userAvatarImg) {
        userAvatarImg.addEventListener('click', () => {
            window.location.href = 'account.html';
        });
    }

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                await auth.signInWithPopup(provider);
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert('Googleログインに失敗しました: ' + error.message);
            }
        });
    }

    function showDialog(message) {
        const dialog = document.getElementById('custom-dialog');
        const dialogMsg = document.getElementById('custom-dialog-message');
        const dialogClose = document.getElementById('custom-dialog-close');
        if (!dialog || !dialogMsg || !dialogClose) {
            // ダイアログ要素が見つからない場合はalertで代用
            alert(message);
            return;
        }
        dialogMsg.textContent = message;
        dialog.style.display = 'flex';
        dialogClose.onclick = () => {
            dialog.style.display = 'none';
        };
    }
});

// 既存のダミーデータ生成関数は不要なので削除
function reportDanger() {
    if (!auth.currentUser) {
        showDialog('危険を報告するにはログインが必要です。');
        window.location.href = 'index.html';
        return;
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            console.log('現在位置:', position.coords.latitude, position.coords.longitude);
            showDialog('危険情報の投稿画面を開きます\n現在位置: ' + position.coords.latitude.toFixed(4) + ', ' + position.coords.longitude.toFixed(4));
        }, function(error) {
            console.log('位置情報の取得に失敗:', error);
            showDialog('危険情報の投稿画面を開きます');
        });
    } else {
        showDialog('危険情報の投稿画面を開きます');
    }
}
function viewMap() {
    console.log('マップを表示します');
    showDialog('危険情報マップを表示します');
}
function openFullMap() {
    console.log('詳細マップを開きます');
    showDialog('詳細マップを表示します');
}
function filterByType(type) {
    console.log(`${type}の危険情報でフィルタリングします`);
    showDialog(`${type}の危険情報を表示します`);
}
function viewReport(reportId) {
    console.log(`報告 ${reportId} の詳細を表示します`);
    showDialog(`報告の詳細を表示します: ${reportId}`);
}
