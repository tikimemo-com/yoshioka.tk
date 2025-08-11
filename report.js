// Firebase設定（dashboard.jsと同じものを使う）
const firebaseConfig = {
    apiKey: "AIzaSyBMmpRvHLrXwwyKGi6IH4IH8IQkE3fjH7w",
    authDomain: "ti-kimemo.firebaseapp.com",
    projectId: "ti-kimemo",
    storageBucket: "ti-kimemo.firebasestorage.app",
    messagingSenderId: "190739467226",
    appId: "1:190739467226:web:724ac64061484b92d58ee3",
    measurementId: "G-EY72HHJD1T"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM取得
const form = document.getElementById('report-form');
const message = document.getElementById('message');

// ログイン状態チェック
auth.onAuthStateChanged(user => {
  if (!user) {
    // ログインしてなければログインページに戻す
    window.location.href = 'index.html';
  }
});

// フォーム送信イベント
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('report-title').value.trim();
  const content = document.getElementById('report-content').value.trim();

  if (!title || !content) {
    message.textContent = 'タイトルと内容は必須です。';
    return;
  }

  try {
    await db.collection('reports').add({
      title,
      content,
      uid: auth.currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    message.style.color = 'green';
    message.textContent = '投稿が完了しました！2秒後にダッシュボードへ戻ります。';

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
  } catch (error) {
    message.style.color = 'red';
    message.textContent = '投稿に失敗しました: ' + error.message;
  }
});
