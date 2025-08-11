// あなたのFirebaseプロジェクトの設定情報
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
// Firestoreの初期化は不要になるので削除します
// const db = firebase.firestore();

// DOM要素の取得
const signupForm = document.getElementById('signupForm');
// verifyCodeForm関連の要素は不要になるので削除します
// const verifyCodeForm = document.getElementById('verifyCodeForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
// verificationCodeInput, resendCodeBtnは不要になるので削除します
// const verificationCodeInput = document.getElementById('verificationCode');
// const resendCodeBtn = document.getElementById('resendCodeBtn');
const errorMessage = document.getElementById('error-message');
const infoMessage = document.getElementById('info-message');

// currentUserIdは不要になるので削除します
// let currentUserId = null; 

// メッセージ表示関数 (変更なし)
function showMessage(element, message, type = 'error') {
    element.textContent = message;
    element.style.color = type === 'error' ? '#e74c3c' : '#3498db';
    element.style.display = 'block';
}

function hideMessage(element) {
    element.textContent = '';
    element.style.display = 'none';
}

// 新規登録処理
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    hideMessage(errorMessage);
    hideMessage(infoMessage);

    const email = emailInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password.length < 6) {
        showMessage(errorMessage, 'パスワードは6文字以上で入力してください。');
        return;
    }
    if (password !== confirmPassword) {
        showMessage(errorMessage, 'パスワードと確認用パスワードが一致しません。');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // ★★★ 新規登録後、メール確認リンクを送信 ★★★
        await user.sendEmailVerification()
            .then(() => {
                showMessage(infoMessage, '新規登録が完了しました！確認メールを送信しましたので、ご確認ください。', 'info');
                // 登録後、自動ログインせず、ログインページへのリダイレクトやメッセージ表示に留める
                // その後、ユーザーはメールのリンクをクリックしてアカウントを確認し、ログインします
                alert('新規登録が完了しました！確認メールを送信しましたので、ご確認ください。ログインページに戻ります。');
                window.location.href = 'index.html'; // ログインページへリダイレクト
            })
            .catch((error) => {
                console.error("確認メールの送信に失敗しました:", error);
                showMessage(errorMessage, '新規登録は完了しましたが、確認メールの送信に失敗しました。後ほどログインして再送信してください。', 'error');
            });

    } catch (error) {
        let message = '新規登録に失敗しました。';
        console.error("認証エラー:", error);
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'このメールアドレスは既に登録されています。';
                break;
            case 'auth/invalid-email':
                message = 'メールアドレスの形式が正しくありません。';
                break;
            case 'auth/weak-password':
                message = 'パスワードが弱すぎます。より強力なパスワードを設定してください。';
                break;
            default:
                message = '予期せぬエラーが発生しました。';
                break;
        }
        showMessage(errorMessage, message);
    }
});

// 確認コード検証処理とコード再送処理は不要になるので削除します
// verifyCodeForm.addEventListener(...
// resendCodeBtn.addEventListener(...