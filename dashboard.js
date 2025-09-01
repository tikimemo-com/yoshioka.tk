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
        // ユーザーがログインしている場合
        console.log("ユーザーがログインしています:", user.email);
        userStatusElement.textContent = `ようこそ、${user.email || 'ユーザー'}さん`;
        logoutLink.style.display = 'block';
        reportButton.style.display = 'flex';
        
        // ログインユーザーの情報をFirestoreに保存（既に存在する場合は更新）
        db.collection("users").doc(user.uid).set({
            email: user.email,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

    } else {
        // ユーザーがログアウトした場合
        console.log("ユーザーがログアウトしています。");
        userStatusElement.textContent = `ログインしていません`;
        logoutLink.style.display = 'none';
        reportButton.style.display = 'none';
    }
});

// マップの初期化
const dangerMap = L.map('danger-map').setView([35.681236, 139.767125], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(dangerMap);

// マップ上の既存マーカーを管理
let dangerMarkers = [];

// Firestoreからリアルタイムで危険情報を取得し、マップに表示
function loadDangerReports() {
    // 既存のマーカーを削除
    dangerMarkers.forEach(marker => dangerMap.removeLayer(marker));
    dangerMarkers = [];

    const typeLabel = {
        traffic: '交通',
        disaster: '災害',
        crime: '犯罪',
        infrastructure: 'インフラ'
    };
    
    db.collection("reports").onSnapshot(snapshot => {
        dangerMarkers.forEach(marker => dangerMap.removeLayer(marker));
        dangerMarkers = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.location && data.location.match(/^[-+]?\d+\.\d+,\s*[-+]?\d+\.\d+$/)) {
                const [lat, lng] = data.location.split(',').map(Number);
                const typeIcon = {
                    traffic: '🚗',
                    disaster: '⚠️',
                    crime: '🔐',
                    infrastructure: '🏗️'
                }[data.type] || '❓';
                const marker = L.marker([lat, lng]).addTo(dangerMap);
                marker.bindPopup(`
                    <div style="font-size:1rem;">
                        <div>${typeIcon} <b>${typeLabel[data.type] || ''}</b></div>
                        <div>${data.description || ''}</div>
                        <div style="color:#888;font-size:0.9rem;">${data.location}</div>
                    </div>
                `);
                dangerMarkers.push(marker);
            }
        });
    });
}

// 相対時間表示
function timeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff/60)}分前`;
    if (diff < 86400) return `${Math.floor(diff/3600)}時間前`;
    if (diff < 2592000) return `${Math.floor(diff/86400)}日前`;
    return date.toLocaleDateString();
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
    // アクティブユーザー数をFirestoreからリアルタイムで取得
    const activeUsersElement = document.getElementById("activeUsers-stat");
    if (activeUsersElement) {
        db.collection("users").onSnapshot((snapshot) => {
            activeUsersElement.textContent = snapshot.size;
        }, (error) => {
            console.error("ユーザーデータの取得中にエラーが発生しました:", error);
        });
    }

    // 総投稿数を取得
    const totalReportsElement = document.getElementById('totalReports-stat');
    if (totalReportsElement) {
        db.collection("reports").onSnapshot((snapshot) => {
            totalReportsElement.textContent = snapshot.size;
        }, (error) => {
            console.error("総投稿数の取得中にエラーが発生しました:", error);
        });
    }

    // 今週の投稿数を取得
    const thisWeekElement = document.getElementById('thisWeek-stat');
    if (thisWeekElement) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        db.collection("reports")
          .where("timestamp", ">=", oneWeekAgo)
          .onSnapshot((snapshot) => {
            thisWeekElement.textContent = snapshot.size;
        }, (error) => {
            console.error("今週の投稿数の取得中にエラーが発生しました:", error);
        });
    }

    // 解決済みの問題をFirestoreから取得
    const resolvedIssuesElement = document.getElementById('resolvedIssues-stat');
    if (resolvedIssuesElement) {
        db.collection("reports")
          .where("status", "==", "resolved")
          .onSnapshot((snapshot) => {
            resolvedIssuesElement.textContent = snapshot.size;
        }, (error) => {
            console.error("解決済み投稿数の取得中にエラーが発生しました:", error);
        });
    }
});