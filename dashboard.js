// Firebaseプロジェクトの設定情報
const firebaseConfig = {
    apiKey: "AIzaSyBMmpRvHLrXwwyKGi6IH4IH8IQkE3fjH7w",
    authDomain: "ti-kimemo.firebaseapp.com",
    projectId: "ti-kimemo",
    storageBucket: "ti-kimemo.firebasestorage.app",
    messagingSenderId: "190739467226",
    appId: "1:190739467226:web:724ac64061484b92d58ee3",
    measurementId: "G-EY72HHJD1T"
};

// Firebaseアプリの初期化
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM要素の取得
const userStatusElement = document.getElementById('user-status');
const logoutLink = document.getElementById('logout-link');
const reportButton = document.getElementById('report-button');
const mapButton = document.getElementById('map-button');

// ログイン状態の監視
auth.onAuthStateChanged(user => {
    if (user) {
        // ユーザーがログインしている場合
        console.log("ユーザーがログインしています:", user.email);
        userStatusElement.textContent = `ようこそ、${user.email || 'ユーザー'}さん`;
        logoutLink.style.display = 'block'; // ログアウトボタンを表示
        reportButton.style.display = 'flex'; // 投稿ボタンを表示
        
    } else {
        // ユーザーがログインしていない場合 (ゲストモード)
        console.log("ユーザーはログインしていません。ゲストモードで表示します。");
        userStatusElement.textContent = 'ゲストモード';
        logoutLink.style.display = 'none'; // ログアウトボタンを非表示
        reportButton.style.display = 'none'; // 投稿ボタンを非表示
    }
});

// ログアウト処理
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await auth.signOut();
            alert('ログアウトしました。');
            window.location.href = 'index.html'; // ログインページへリダイレクト
        } catch (error) {
            console.error("ログアウトエラー:", error);
            alert('ログアウト中にエラーが発生しました。');
        }
    });
}

// ゲストユーザーが投稿ボタンを押した時の処理
if (reportButton) {
    reportButton.addEventListener('click', () => {
        // ログイン状態を再度チェック
        if (!auth.currentUser) {
            alert('投稿するにはログインが必要です。');
            window.location.href = 'index.html';
            return;
        }
        // 投稿機能（ダミー）
        alert('新しいメモを追加する機能はまだ実装されていません。');
    });
}


// マップボタンの機能（ダミー）
if (mapButton) {
    mapButton.addEventListener('click', () => {
        alert('マップ機能はまだ実装されていません。');
    });
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
    // データ更新（実際の実装では API から取得）
    function updateStats() {
        // 統計データの更新
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

    // PWA対応の準備（Service Worker登録など）
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    }
});