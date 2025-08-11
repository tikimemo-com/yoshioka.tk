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

// Firebase 初期化
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {

  // ログイン状態変化監視
  auth.onAuthStateChanged(user => {
    const path = window.location.pathname;

    if (user) {
      console.log("ユーザーがログインしています:", user.email);
      if (path.endsWith('index.html') || path.endsWith('/')) {
        window.location.href = 'dashboard.html';
      }
      if (path.endsWith('register.html')) {
        window.location.href = 'dashboard.html';
      }
      const logoutBtn = document.getElementById('logout-button');
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    } else {
      console.log("ユーザーはログアウトしています。");
      if (path.endsWith('dashboard.html') || path.endsWith('report.html')) {
        // ログインなしならログインページに戻す
        window.location.href = 'index.html';
      }
      const logoutBtn = document.getElementById('logout-button');
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  });

  // ログインフォーム処理
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;
      try {
        await auth.signInWithEmailAndPassword(email, password);
        alert('ログインしました！');
        window.location.href = 'dashboard.html';
      } catch (error) {
        alert(`ログインに失敗しました: ${error.message}`);
      }
    });
  }

  // 投稿フォーム処理
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
      const title = reportForm['report-title'].value.trim();
      const type = reportForm['report-type'].value;
      const location = reportForm['report-location'].value.trim();
      const description = reportForm['report-description'].value.trim();

      try {
        await db.collection('reports').add({
          title,
          type,
          location,
          description,
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
        if (reportMessage) {
          reportMessage.textContent = `投稿に失敗しました: ${error.message}`;
          reportMessage.style.display = 'block';
          reportMessage.classList.add('error-message');
          reportMessage.classList.remove('info-message');
        }
      }
    });
  }

  // ログアウト処理
  const logoutBtn = document.getElementById('logout-button');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await auth.signOut();
        alert('ログアウトしました。');
        window.location.href = 'index.html';
      } catch (error) {
        alert(`ログアウトに失敗しました: ${error.message}`);
      }
    });
  }

});

// マップ表示（仮）
function viewMap() {
  alert('危険情報マップを表示します（仮）');
}
