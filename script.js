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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// 危険情報のタイプとアイコンを一元管理
const typeLabels = {
    kiken: '危険',
    johou: '情報',
    chui: '注意'
};

const typeIcons = {
    kiken: '🚨',
    johou: 'ℹ️',
    chui: '⚠️'
};

// DOM要素の取得 (login page)
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const googleLoginBtn = document.getElementById('google-login-btn');
const guestButton = document.getElementById('guest-button');
const registerBtn = document.getElementById('register-btn');
const cancelRegisterBtn = document.getElementById('cancel-register-btn');

// DOM要素の取得 (report page)
const reportForm = document.getElementById('reportForm');
const geolocateButton = document.getElementById('geolocate-button');
const searchLocationButton = document.getElementById('search-location-button');
const searchAddressInput = document.getElementById('search-address');
const reportLocationInput = document.getElementById('report-location');

// 認証状態の監視
auth.onAuthStateChanged(user => {
    const isLoginPage = location.pathname.endsWith('index.html');
    const isDashboardPage = location.pathname.endsWith('dashboard.html');
    const isReportPage = location.pathname.endsWith('report.html');
    const isAccountPage = location.pathname.endsWith('account.html');
    
    // ログインページの場合
    if (isLoginPage) {
        if (user) {
            window.location.href = 'dashboard.html';
        }
        return;
    }
    
    // ダッシュボードページの場合
    if (isDashboardPage) {
        const loginButton = document.getElementById('dashboard-login-button');
        const accountAvatar = document.getElementById('account-avatar');
        
        if (user) {
            if (loginButton) loginButton.style.display = 'none';
            if (accountAvatar) {
                accountAvatar.style.display = 'block';
                const avatarImg = document.getElementById('user-avatar-img');
                if (user.photoURL) {
                    avatarImg.src = user.photoURL;
                } else {
                    avatarImg.src = `https://ui-avatars.com/api/?name=${user.displayName || user.email || 'Guest'}&background=3498db&color=fff&size=36`;
                }
            }
        } else {
            if (loginButton) loginButton.style.display = 'block';
            if (accountAvatar) accountAvatar.style.display = 'none';
        }
    }

    // アカウントページの場合
    if (isAccountPage) {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        const displayNameDiv = document.getElementById('displayNameDiv');
        const emailDiv = document.getElementById('emailDiv');
        const accountAvatarImg = document.getElementById('account-avatar-img');

        if (displayNameDiv) displayNameDiv.textContent = user.displayName || '未設定';
        if (emailDiv) emailDiv.textContent = user.email || 'ゲストユーザー';
        if (accountAvatarImg) {
            accountAvatarImg.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email || 'Guest'}&background=3498db&color=fff&size=80`;
        }
    }
});

// ログイン画面の機能
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        auth.signInWithEmailAndPassword(email, password)
            .then(() => showDialog('ログインしました！'))
            .catch(error => {
                console.error("ログインエラー:", error.message);
                showDialog('ログインに失敗しました。');
            });
    });
}

if (registerForm) {
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        });
    }
    if (cancelRegisterBtn) {
        cancelRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = registerForm['reg-email'].value;
        const password = registerForm['reg-password'].value;
        auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                showDialog('新規登録が完了しました！');
                db.collection("users").doc(cred.user.uid).set({
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .catch(error => {
                console.error("新規登録エラー:", error.message);
                showDialog('新規登録に失敗しました。');
            });
    });
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        auth.signInWithPopup(googleProvider)
            .then(() => showDialog('Googleアカウントでログインしました！'))
            .catch(error => {
                console.error("Googleログインエラー:", error.message);
                showDialog('Googleログインに失敗しました。');
            });
    });
}

if (guestButton) {
    guestButton.addEventListener('click', () => {
        auth.signInAnonymously()
            .then(() => showDialog('ゲストとしてログインしました！'))
            .catch(error => {
                console.error("ゲストログインエラー:", error.message);
                showDialog('ゲストログインに失敗しました。');
            });
    });
}

// ログアウト機能
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => showDialog('ログアウトしました'))
            .catch(error => showDialog('ログアウト中にエラーが発生しました。' + error.message));
    });
}

// アカウント情報編集
const editBtn = document.getElementById('editBtn');
const editForm = document.getElementById('editForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editDisplayName = document.getElementById('editDisplayName');
const displayNameDiv = document.getElementById('displayNameDiv');

if (editBtn && editForm && cancelEditBtn && editDisplayName && displayNameDiv) {
    editBtn.addEventListener('click', () => {
        const user = auth.currentUser;
        if (!user) return;
        editDisplayName.value = user.displayName || '';
        editForm.style.display = 'block';
        editBtn.style.display = 'none';
    });
    
    cancelEditBtn.addEventListener('click', () => {
        editForm.style.display = 'none';
        editBtn.style.display = 'block';
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const newName = editDisplayName.value.trim();
        if (!newName) return;
        try {
            await user.updateProfile({ displayName: newName });
            displayNameDiv.textContent = newName;
            showDialog('表示名を更新しました');
            editForm.style.display = 'none';
            editBtn.style.display = 'block';
        } catch (error) {
            showDialog('表示名の更新に失敗しました: ' + error.message);
        }
    });
}

// ダッシュボードの統計データをFirebaseから取得・更新
document.addEventListener('DOMContentLoaded', () => {
    // URLのクエリパラメータをチェック
    const urlParams = new URLSearchParams(window.location.search);
    const filterType = urlParams.get('filter');

    if (location.pathname.endsWith('full-map.html')) {
        // full-map.html の場合
        initFullMap(filterType);
    } else {
        // ダッシュボードの場合
        updateDashboardContent();

        const totalReportsElement = document.getElementById('totalReports');
        if (totalReportsElement) {
            db.collection('reports').onSnapshot(snapshot => {
                totalReportsElement.textContent = snapshot.size;
                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const thisWeekCount = snapshot.docs.filter(doc => {
                    const timestamp = doc.data().timestamp;
                    return timestamp && timestamp.toDate() >= oneWeekAgo;
                }).length;
                const thisWeekElement = document.getElementById('thisWeek');
                if (thisWeekElement) {
                    thisWeekElement.textContent = thisWeekCount;
                }
            });
        }

        const activeUsersElement = document.getElementById('activeUsers');
        if (activeUsersElement) {
            db.collection('users').onSnapshot(snapshot => {
                activeUsersElement.textContent = snapshot.size;
            });
        }
        
        const resolvedIssuesElement = document.getElementById('resolvedIssues');
        if (resolvedIssuesElement) {
            db.collection('reports').where('status', '==', 'resolved').onSnapshot(snapshot => {
                resolvedIssuesElement.textContent = snapshot.size;
            });
        }

        // 危険情報の種類ごとの投稿数を取得・更新
        const dangerTypes = ['kiken', 'johou', 'chui'];
        dangerTypes.forEach(type => {
            db.collection('reports').where('type', '==', type).onSnapshot(snapshot => {
                const countElement = document.getElementById(`${type}Count`);
                if (countElement) {
                    countElement.textContent = snapshot.size;
                }
            });
        });
    }

    // マップ関連
    let leafletMap, marker;
    if (geolocateButton || searchLocationButton) {
        const locationMapPreview = document.getElementById('location-map-preview');
        if (locationMapPreview) {
            leafletMap = L.map('location-map-preview').setView([35.681236, 139.767125], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(leafletMap);
        }
    }
});

// ダッシュボードコンテンツを更新する関数
function updateDashboardContent() {
    const recentList = document.getElementById('recent-list');
    if (recentList) {
        db.collection('reports')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                recentList.innerHTML = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const location = data.location || '';
                    const description = data.description || '';
                    const time = data.timestamp && data.timestamp.toDate
                        ? timeAgo(data.timestamp.toDate())
                        : '';
                    recentList.innerHTML += `
                        <div class="recent-item ${data.type}" onclick="viewReport('${doc.id}')">
                            <div class="recent-icon">${typeIcons[data.type] || '❓'}</div>
                            <div class="recent-content">
                                <div class="recent-details">
                                    <div class="recent-location">📍 ${location}</div>
                                    <div class="recent-time">⏰ ${time}</div>
                                    <div class="recent-type">${typeLabels[data.type] || ''}</div>
                                </div>
                                <div class="recent-title">${description}</div>
                            </div>
                        </div>
                    `;
                });
            });
    }
    
    const dangerMapDiv = document.getElementById('danger-map');
    if (dangerMapDiv) {
        const dangerMap = L.map('danger-map').setView([35.681236, 139.767125], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(dangerMap);
        
        let dangerMarkers = [];
        db.collection('reports').onSnapshot(snapshot => {
            dangerMarkers.forEach(marker => marker.remove());
            dangerMarkers.length = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.location && typeof data.location === 'string' && data.location.match(/^[-+]?\d+\.\d+,\s*[-+]?\d+\.\d+$/)) {
                    const [lat, lng] = data.location.split(',').map(Number);
                    const marker = L.marker([lat, lng]).addTo(dangerMap);
                    marker.bindPopup(`
                        <div style="font-size:1rem;">
                            <div>${typeIcons[data.type] || '❓'} <b>${typeLabels[data.type] || ''}</b></div>
                            <div>${data.description || ''}</div>
                            <div style="color:#888;font-size:0.9rem;">${data.location}</div>
                        </div>
                    `);
                    dangerMarkers.push(marker);
                }
            });
        });
    }
}

// 全画面マップを初期化する関数
function initFullMap(filterType) {
    const fullMapContainer = document.getElementById('full-map-container');
    const filteredReportsContainer = document.querySelector('.filtered-reports-container');
    const filteredReportsList = document.getElementById('filtered-reports-list');
    const filteredHeaderTitle = document.getElementById('filtered-header-title');
    const filteredHeaderIcon = document.getElementById('filtered-header-icon');
    const filterButtons = document.getElementById('filter-buttons');

    if (fullMapContainer) {
        const fullMap = L.map('full-map-container').setView([35.681236, 139.767125], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(fullMap);
        let dangerMarkers = [];

        const updateMapAndList = (type) => {
            dangerMarkers.forEach(marker => marker.remove());
            dangerMarkers.length = 0;
            filteredReportsList.innerHTML = '';
            
            let reportsRef = db.collection('reports');
            if (type) {
                reportsRef = reportsRef.where('type', '==', type);
            }

            reportsRef.onSnapshot(snapshot => {
                dangerMarkers.forEach(marker => marker.remove());
                dangerMarkers.length = 0;
                filteredReportsList.innerHTML = '';
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.location && typeof data.location === 'string' && data.location.match(/^[-+]?\d+\.\d+,\s*[-+]?\d+\.\d+$/)) {
                        const [lat, lng] = data.location.split(',').map(Number);
                        const marker = L.marker([lat, lng]).addTo(fullMap);
                        marker.bindPopup(`
                            <div style="font-size:1rem;">
                                <div>${typeIcons[data.type] || '❓'} <b>${typeLabels[data.type] || ''}</b></div>
                                <div>${data.description || ''}</div>
                                <div style="color:#888;font-size:0.9rem;">${data.location}</div>
                            </div>
                        `);
                        dangerMarkers.push(marker);
                    }

                    const reportItem = document.createElement('div');
                    reportItem.className = `filtered-report-item ${data.type}`;
                    reportItem.innerHTML = `
                        <div class="recent-content">
                            <div class="recent-details">
                                <div class="recent-location">📍 ${data.location || ''}</div>
                                <div class="recent-time">⏰ ${timeAgo(data.timestamp.toDate())}</div>
                            </div>
                            <div class="recent-title">${data.description || ''}</div>
                        </div>
                    `;
                    reportItem.onclick = () => viewReport(doc.id);
                    filteredReportsList.appendChild(reportItem);
                });

                if (type) {
                    filteredReportsContainer.style.display = 'block';
                    filteredHeaderTitle.textContent = `${typeLabels[type] || ''} 投稿一覧`;
                    filteredHeaderIcon.textContent = typeIcons[type] || '❓';
                } else {
                    filteredReportsContainer.style.display = 'none';
                }
            });

            // フィルタボタンのアクティブ状態を更新
            if (filterButtons) {
                const buttons = filterButtons.querySelectorAll('.filter-button');
                buttons.forEach(button => {
                    button.classList.remove('active');
                    if (button.textContent.includes(typeLabels[type]) || (type === null && button.textContent === 'すべて')) {
                        button.classList.add('active');
                    }
                });
            }
        };

        updateMapAndList(filterType);
    }
}

// 危険報告ページでのフォーム送信処理
if (reportForm) {
    const reportTypeInput = document.getElementById('report-type');
    const reportDescriptionInput = document.getElementById('report-description');
    
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            showDialog('ログインが必要です。');
            return;
        }

        db.collection('reports').add({
            type: reportTypeInput.value,
            description: reportDescriptionInput.value,
            location: reportLocationInput.value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            uid: user.uid,
            status: 'unresolved'
        })
        .then(() => {
            showDialog('危険情報が正常に投稿されました！');
            reportForm.reset();
        })
        .catch(error => {
            console.error('投稿エラー:', error);
            showDialog('投稿に失敗しました。');
        });
    });
}

// 位置情報取得ボタンの処理
if (geolocateButton) {
    geolocateButton.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                reportLocationInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                leafletMap.setView([lat, lng], 16);
                if (marker) {
                    marker.setLatLng([lat, lng]);
                } else {
                    marker = L.marker([lat, lng]).addTo(leafletMap);
                }
                document.getElementById('location-map-preview').style.display = 'block';
            }, error => {
                console.error("位置情報の取得に失敗しました:", error);
                showDialog('位置情報の取得に失敗しました。手動で入力してください。');
            });
        } else {
            showDialog('このブラウザは位置情報に対応していません。');
        }
    });
}

// 住所検索ボタンの処理
if (searchLocationButton) {
    searchLocationButton.addEventListener('click', async () => {
        const query = searchAddressInput.value;
        if (query) {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=ja`;
            try {
                const res = await fetch(url, { headers: { 'User-Agent': 'thikimemo-app/1.0' } });
                const data = await res.json();
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lng = parseFloat(data[0].lon);
                    reportLocationInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    leafletMap.setView([lat, lng], 16);
                    if (marker) {
                        marker.setLatLng([lat, lng]);
                    } else {
                        marker = L.marker([lat, lng]).addTo(leafletMap);
                    }
                    document.getElementById('location-map-preview').style.display = 'block';
                } else {
                    showDialog('検索結果が見つかりませんでした。');
                }
            } catch (error) {
                console.error('検索エラー:', error);
                showDialog('検索中にエラーが発生しました。');
            }
        }
    });
}

// ユーティリティ: カスタムダイアログ
function showDialog(message) {
    const dialog = document.getElementById('custom-dialog');
    const dialogMsg = document.getElementById('custom-dialog-message');
    const dialogClose = document.getElementById('custom-dialog-close');
    if (!dialog || !dialogMsg || !dialogClose) {
        alert(message);
        return;
    }
    dialogMsg.textContent = message;
    dialog.style.display = 'flex';
    dialogClose.onclick = () => {
        dialog.style.display = 'none';
    };
}

// ダッシュボードからフィルタリングされたマップに遷移する関数
function openFilteredMap(type) {
    let url = 'full-map.html';
    if (type) {
        url += `?filter=${type}`;
    }
    window.location.href = url;
}

// ダミー関数
function reportDanger() {
    window.location.href = 'report.html';
}

function viewMap() {
    window.location.href = 'dashboard.html';
}

function viewReport(reportId) {
    showDialog(`報告ID ${reportId} の詳細を表示します。`);
}

function timeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff/60)}分前`;
    if (diff < 86400) return `${Math.floor(diff/3600)}時間前`;
    return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;
}
