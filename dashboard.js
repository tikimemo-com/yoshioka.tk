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

        // 投稿ボタンのクリックイベントを設定
        reportButton.onclick = () => {
            showReportForm();
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

// 投稿フォーム表示＆Firestore書き込み処理
function showReportForm() {
    // 既にフォームがあれば重複生成防止
    if (document.getElementById('report-form')) return;

    const formHtml = `
        <div id="report-form" style="position:fixed;top:20%;left:50%;transform:translateX(-50%);
            background:#fff;padding:20px;border:1px solid #ccc;border-radius:8px;z-index:1000;">
            <h3>新しいメモを投稿</h3>
            <input type="text" id="report-title" placeholder="タイトル" style="width:100%;margin-bottom:8px;"><br>
            <textarea id="report-content" placeholder="内容" style="width:100%;height:100px;margin-bottom:8px;"></textarea><br>
            <button id="submit-report">送信</button>
            <button id="cancel-report">キャンセル</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHtml);

    // 送信処理
    document.getElementById('submit-report').addEventListener('click', async () => {
        const title = document.getElementById('report-title').value.trim();
        const content = document.getElementById('report-content').value.trim();

        if (!title || !content) {
            alert('タイトルと内容を入力してください');
            return;
        }

        try {
            await db.collection('reports').add({
                title,
                content,
                uid: auth.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('投稿が完了しました');
            document.getElementById('report-form').remove();
        } catch (error) {
            console.error('投稿エラー:', error);
            alert('投稿に失敗しました');
        }
    });

    // キャンセル処理
    document.getElementById('cancel-report').addEventListener('click', () => {
        document.getElementById('report-form').remove();
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
