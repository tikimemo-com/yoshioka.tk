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
const db = firebase.firestore();

// DOM要素の取得
const userStatusElement = document.getElementById('user-status');
const logoutLink = document.getElementById('logout-link');
const reportButton = document.getElementById('report-button');
const mapButton = document.getElementById('map-button');

// ログイン状態の監視
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("ログインユーザー:", user.email);
        userStatusElement.textContent = `ようこそ、${user.email || 'ユーザー'}さん`;
        logoutLink.style.display = 'block';
        reportButton.style.display = 'flex';

        // 投稿ボタンのクリックイベント
        reportButton.onclick = () => {
            window.location.href = 'report.html';
        };

    } else {
        console.log("未ログインユーザー");
        userStatusElement.textContent = 'ゲストモード';
        logoutLink.style.display = 'none';
        reportButton.style.display = 'none';

        reportButton.onclick = null;
    }
});

// ログアウト処理
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await auth.signOut();
            alert('ログアウトしました。');
            window.location.href = 'index.html';
        } catch (error) {
            console.error("ログアウトエラー:", error);
            alert('ログアウト中にエラーが発生しました。');
        }
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
    // 統計データ更新（テスト用ランダム）
    function updateStats() {
        const stats = {
            totalReports: Math.floor(Math.random() * 50) + 220,
            thisWeek: Math.floor(Math.random() * 10) + 8,
            activeUsers: Math.floor(Math.random() * 20) + 75,
            resolvedIssues: Math.floor(Math.random() * 30) + 140
        };

        Object.keys(stats).forEach(key => {
            const element = document.getElementById(key);
            if (element) element.textContent = stats[key];
        });
    }

    updateStats();

    // Service Worker登録（PWA対応）
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(() => console.log('Service Worker registration failed'));
    }
});
