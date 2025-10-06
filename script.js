const fmt = (n, cur) => (cur || "¥") + Number(n || 0).toLocaleString();
const state = {
    amazon: [], yamato: [], deduct: []
};
const q = sel => document.querySelector(sel);

// テーブルに行を追加する新しい関数
function addTableRow(kind) {
    const tbody = q('#p_' + kind);
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input class="editable-cell" placeholder="摘要" value="" /></td>
        <td class="right"><input class="editable-cell" type="number" step="1" placeholder="数量" value="" style="text-align:right" /></td>
        <td class="right"><input class="editable-cell" type="number" step="1" placeholder="単価" value="" style="text-align:right" /></td>
        <td class="right calculated-amount">0</td>
    `;

    // 削除ボタンを追加（印刷時は非表示）
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn small hide-print';
    deleteBtn.textContent = '×';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.right = '-30px';
    deleteBtn.style.top = '50%';
    deleteBtn.style.transform = 'translateY(-50%)';
    deleteBtn.onclick = () => {
        row.remove();
        calculateTotals();
        updateAddButtonPositions(); // ボタン位置を更新
        saveData();
    };

    row.style.position = 'relative';
    row.appendChild(deleteBtn);

    // 入力フィールドにイベントリスナーを追加
    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            updateRowAmount(row);
            calculateTotals();
            saveData();
        });
    });

    tbody.appendChild(row);
    updateRowAmount(row);
    calculateTotals();
    updateAddButtonPositions(); // ボタン位置を更新
    saveData();
}

// 行の金額を更新
function updateRowAmount(row) {
    const inputs = row.querySelectorAll('input');
    const qty = parseFloat(inputs[1].value || 0);
    const price = parseFloat(inputs[2].value || 0); // 単位列を削除したので、単価は2番目のインデックス
    const amount = qty * price;
    const amountCell = row.querySelector('.calculated-amount');
    amountCell.textContent = fmt(amount).replace('¥', ''); // ¥マークを削除
}

// 合計を計算
function calculateTotals() {
    const getTableTotal = (tableId) => {
        const rows = q('#' + tableId).querySelectorAll('tr');
        let total = 0;
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 3) { // 3列に変更
                const qty = parseFloat(inputs[1].value || 0);
                const price = parseFloat(inputs[2].value || 0); // 単価のインデックスを変更
                total += qty * price;
            }
        });
        return total;
    };

    const amazonTotal = getTableTotal('p_amazon');
    const yamatoTotal = getTableTotal('p_yamato');
    const deductTotal = getTableTotal('p_deduct');

    const subtotal = amazonTotal + yamatoTotal;
    const taxRate = 0.1; // 10% 固定
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + tax - deductTotal;

    q('#p_subtotal').textContent = fmt(subtotal).replace('¥', '');
    q('#p_deductTotal').textContent = fmt(deductTotal).replace('¥', '');
    q('#p_total').textContent = fmt(total).replace('¥', '');
}

// データを保存用に収集
function getDataFromTables() {
    const getTableData = (tableId) => {
        const rows = q('#' + tableId).querySelectorAll('tr');
        const data = [];
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 3) {
                data.push({
                    title: inputs[0].value || '',
                    qty: parseFloat(inputs[1].value || 0),
                    price: parseFloat(inputs[2].value || 0)
                });
            }
        });
        return data;
    };

    return {
        amazon: getTableData('p_amazon'),
        yamato: getTableData('p_yamato'),
        deduct: getTableData('p_deduct')
    };
}

// テーブルにデータを設定
function setDataToTables(data) {
    const setTableData = (tableId, items) => {
        const tbody = q('#' + tableId);
        tbody.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input class="editable-cell" value="${item.title || ''}" /></td>
                <td class="right"><input class="editable-cell" type="number" step="1" value="${item.qty || ''}" style="text-align:right" /></td>
                <td class="right"><input class="editable-cell" type="number" step="1" value="${item.price || ''}" style="text-align:right" /></td>
                <td class="right calculated-amount">0</td>
            `;

            // 削除ボタンを追加
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn small hide-print';
            deleteBtn.textContent = '×';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.right = '-30px';
            deleteBtn.style.top = '50%';
            deleteBtn.style.transform = 'translateY(-50%)';
            deleteBtn.onclick = () => {
                row.remove();
                calculateTotals();
                updateAddButtonPositions(); // ボタン位置を更新
                saveData();
            };

            row.style.position = 'relative';
            row.appendChild(deleteBtn);

            // イベントリスナーを追加
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    updateRowAmount(row);
                    calculateTotals();
                    saveData();
                });
            });

            tbody.appendChild(row);
            updateRowAmount(row);
        });
    };

    setTableData('p_amazon', data.amazon || []);
    setTableData('p_yamato', data.yamato || []);
    setTableData('p_deduct', data.deduct || []);

    calculateTotals();
    updateAddButtonPositions(); // データ設定後にボタン位置を更新
}

// 追加ボタンの位置を更新する関数
function updateAddButtonPositions() {
    const sections = [
        { name: 'amazon', buttonSelector: '.add-btn[onclick*="amazon"]' },
        { name: 'yamato', buttonSelector: '.add-btn[onclick*="yamato"]' },
        { name: 'deduct', buttonSelector: '.add-btn[onclick*="deduct"]' }
    ];

    sections.forEach(section => {
        const tbody = q('#p_' + section.name);
        const addBtn = document.querySelector(section.buttonSelector);

        if (!addBtn || !tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const tableRect = q('.tbl').getBoundingClientRect();

        if (rows.length === 0) {
            // データ行がない場合はセクションヘッダー行の下に配置
            const sectionHeaders = document.querySelectorAll('tbody.section-group');
            let targetHeader = null;

            // 該当するセクションヘッダーを見つける
            sectionHeaders.forEach(header => {
                const btn = header.querySelector(section.buttonSelector);
                if (btn) targetHeader = header;
            });

            if (targetHeader) {
                const headerRow = targetHeader.querySelector('tr.section-row');
                if (headerRow) {
                    const headerRect = headerRow.getBoundingClientRect();
                    addBtn.style.left = '6px';
                    addBtn.style.top = (headerRect.bottom - tableRect.top + 6) + 'px';
                }
            }
        } else {
            // データ行がある場合は最後の行の左下に配置
            const lastRow = rows[rows.length - 1];
            const firstCell = lastRow.querySelector('td');

            if (firstCell) {
                const cellRect = firstCell.getBoundingClientRect();
                addBtn.style.left = '6px';
                addBtn.style.top = (cellRect.bottom - tableRect.top + 6) + 'px';
            }
        }
    });
}

function ymd(dateStr) {
    if (!dateStr) return '----年--月--日';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// 簡素化されたrender関数（プレビュー直接編集なので最小限）
function render() {
    // 初期値の設定のみ（編集可能要素は直接編集されるため）
    if (!q('#p_toName').textContent.trim()) {
        q('#p_toName').textContent = '株式会社 御中';
    }
    if (!q('#p_fromName').textContent.trim()) {
        q('#p_fromName').textContent = '株式会社ACE CREATION';
    }
    // 計算の更新
    calculateTotals();
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const sheet = q('#sheet');

    // PDF生成クラスを追加
    sheet.classList.add('pdf-generating');

    // PDF生成時にボタンを一時的に非表示にする
    const buttons = sheet.querySelectorAll('button, .btn, .add-btn');
    const originalStyles = [];

    // ボタンを非表示にして元のスタイルを保存
    buttons.forEach((btn, index) => {
        originalStyles[index] = btn.style.display;
        btn.style.display = 'none';
        btn.style.visibility = 'hidden';
    });

    try {
        // 少し待ってからキャプチャ（レンダリング完了を待つ）
        await new Promise(resolve => setTimeout(resolve, 100));

        // html2canvasでキャプチャ
        const canvas = await html2canvas(sheet, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            ignoreElements: (element) => {
                // ボタン要素を完全に無視
                return element.tagName === 'BUTTON' ||
                    element.classList.contains('btn') ||
                    element.classList.contains('add-btn');
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save('invoice.pdf');
    } finally {
        // ボタンを元の状態に戻す
        buttons.forEach((btn, index) => {
            btn.style.display = originalStyles[index];
            btn.style.visibility = '';
        });

        // PDF生成クラスを削除
        sheet.classList.remove('pdf-generating');
    }
}

// 新しいsaveData関数（プレビューから直接データを取得）
function saveData() {
    const data = {
        // ヘッダー情報
        toName: q('#p_toName').textContent,
        toAddr: q('#p_toAddr').innerHTML,
        subject: q('#p_subject').textContent,
        issueDate: q('#p_issueDate').textContent,
        invoiceNo: q('#p_invoiceNo').textContent,
        billAmountDisplay: q('#p_billAmountDisplay').textContent,

        // 差出人情報
        fromName: q('#p_fromName').textContent,
        fromAddr: q('#p_fromAddr').innerHTML,
        fromTel: q('#p_fromTel').textContent,
        fromReg: q('#p_fromReg').textContent,

        // 銀行情報
        dueDate: q('#p_dueDate').textContent,
        bankName: q('#p_bankName').textContent,
        bankNo: q('#p_bankNo').textContent,
        bankHolder: q('#p_bankHolder').textContent,
        notes: q('#p_notes').innerHTML,

        // テーブルデータ
        tableData: getDataFromTables()
    };
    localStorage.setItem('invoice_direct_edit_v1', JSON.stringify(data));
}

// 互換性のためのsaveTemp関数
function saveTemp() {
    saveData();
}

function loadTemp() {
    // 新しい形式のデータを試す
    let j = localStorage.getItem('invoice_direct_edit_v1');
    if (j) {
        const d = JSON.parse(j);
        // プレビュー要素に直接設定
        q('#p_toName').textContent = d.toName || '株式会社 御中';
        q('#p_toAddr').innerHTML = d.toAddr || '〒<br />（住所）';
        q('#p_subject').textContent = d.subject || '2025年8月稼働分';
        q('#p_issueDate').textContent = d.issueDate || '2025年 月 日';
        q('#p_invoiceNo').textContent = d.invoiceNo || '###########';
        q('#p_billAmountDisplay').textContent = d.billAmountDisplay || '￥ --------（税込）';

        q('#p_fromName').textContent = d.fromName || '株式会社ACE CREATION';
        q('#p_fromAddr').innerHTML = d.fromAddr || '〒615-0904<br />京都市右京区梅津堤上町21<br />KKハウスⅡ 101号室';
        q('#p_fromTel').textContent = d.fromTel || '080-9540-4451';
        q('#p_fromReg').textContent = d.fromReg || 'T6130001080238';

        q('#p_dueDate').textContent = d.dueDate || '----年--月--日';
        q('#p_bankName').textContent = d.bankName || '';
        q('#p_bankNo').textContent = d.bankNo || '';
        q('#p_bankHolder').textContent = d.bankHolder || '';
        q('#p_notes').innerHTML = d.notes || '';

        // テーブルデータを設定
        if (d.tableData) {
            setDataToTables(d.tableData);
        }

        render();
        return;
    }

    // 古い形式のデータへのフォールバック
    j = localStorage.getItem('invoice_simple_v1');
    if (j) {
        const d = JSON.parse(j);
        // 古いデータを新しい形式に変換
        q('#p_toName').textContent = d.toName || '株式会社 御中';
        q('#p_toAddr').innerHTML = (d.toAddr || '〒\n（住所）').replace(/\n/g, '<br/>');
        q('#p_subject').textContent = d.subject || '2025年8月稼働分';
        // ... 他のフィールドも同様に変換

        // 古いアイテム形式をテーブル形式に変換
        const tableData = {
            amazon: d.amazon || [],
            yamato: d.yamato || [],
            deduct: d.deduct || []
        };
        setDataToTables(tableData);

        render();
    }
}

function clearAll() {
    localStorage.removeItem('invoice_simple_v1');
    location.reload();
}

// イベントリスナー設定
q('#pdfBtn').onclick = downloadPDF;
q('#printBtn').onclick = () => window.print();
q('#saveBtn').onclick = saveData;
q('#loadBtn').onclick = loadTemp;
q('#clearBtn').onclick = clearAll;

// 古い関数群は削除済み

// 初期化関数
function initializeApp() {
    // 固定値を設定
    q('#p_greeting').textContent = '下記の通りご請求申し上げます。';

    // 初期値を設定
    if (!q('#p_toName').textContent.trim()) {
        q('#p_toName').textContent = '株式会社 御中';
    }
    if (!q('#p_toAddr').innerHTML.trim()) {
        q('#p_toAddr').innerHTML = '〒<br />（住所）';
    }
    if (!q('#p_subject').textContent.trim()) {
        q('#p_subject').textContent = '2025年8月稼働分';
    }
    if (!q('#p_fromName').textContent.trim()) {
        q('#p_fromName').textContent = '株式会社ACE CREATION';
    }
    if (!q('#p_fromAddr').innerHTML.trim()) {
        q('#p_fromAddr').innerHTML = '〒615-0904<br />京都市右京区梅津堤上町21<br />KKハウスⅡ 101号室';
    }
    if (!q('#p_fromTel').textContent.trim()) {
        q('#p_fromTel').textContent = '080-9540-4451';
    }
    if (!q('#p_fromReg').textContent.trim()) {
        q('#p_fromReg').textContent = 'T6130001080238';
    }
    if (!q('#p_billAmountDisplay').textContent.trim()) {
        q('#p_billAmountDisplay').textContent = '￥ --------（税込）';
    }

    // イベントリスナーを設定
    setupEditListeners();

    // 初期テーブル行を追加（各セクションに1行ずつ）
    addTableRow('amazon');
    addTableRow('yamato');
    addTableRow('deduct');

    calculateTotals();
    updateAddButtonPositions(); // 初期化時にボタン位置を設定
}

// 編集要素にイベントリスナーを設定
function setupEditListeners() {
    const editableElements = document.querySelectorAll('.editable');
    editableElements.forEach(el => {
        el.addEventListener('input', saveData);
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                el.blur();
            }
        });
    });
}

// 敬称選択機能（クリック切り替え式）
function setupHonorificSelector() {
    console.log('敬称機能の初期化開始');

    // DOMが完全に読み込まれるまで少し待つ
    setTimeout(() => {
        const honorificClickable = document.getElementById('p_honorific_clickable');
        console.log('敬称要素:', honorificClickable);

        if (honorificClickable) {
            let currentHonorific = honorificClickable.textContent.trim() || '御中';
            console.log('初期敬称:', currentHonorific);

            // クリックイベントを設定
            honorificClickable.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('敬称クリック検出:', currentHonorific);

                // 御中 ⇔ 様 の切り替え
                currentHonorific = currentHonorific === '御中' ? '様' : '御中';
                this.textContent = currentHonorific;
                console.log('敬称変更完了:', currentHonorific);

                // データ保存（存在する場合）
                if (typeof saveData === 'function') {
                    saveData();
                }

                return false;
            };

            // マウスオーバー効果をJavaScriptでも設定
            honorificClickable.onmouseenter = function () {
                this.style.backgroundColor = '#f0f8ff';
            };

            honorificClickable.onmouseleave = function () {
                this.style.backgroundColor = 'transparent';
            };

            console.log('敬称機能初期化完了');
        } else {
            console.error('敬称要素が見つかりません - ID: p_honorific_clickable');
        }
    }, 100);
}

// 郵便番号API機能（モーダル式）
function setupPostalCodeLookup() {
    const toAddr = q('#p_toAddr');
    const postalModal = q('#postal_input_modal');
    const postalCode1 = q('#postal_code_1');
    const postalCode2 = q('#postal_code_2');
    const lookupBtn = q('#address_lookup_btn');
    const closeBtn = q('#postal_modal_close');

    console.log('郵便番号要素チェック:', {
        toAddr, postalModal, postalCode1, postalCode2, lookupBtn, closeBtn
    }); // デバッグ用

    if (!toAddr || !postalModal || !postalCode1 || !postalCode2 || !lookupBtn || !closeBtn) {
        console.error('郵便番号機能：必要な要素が見つかりません');
        return;
    }

    // 住所欄をダブルクリックでモーダルを開く
    toAddr.addEventListener('dblclick', function (e) {
        e.preventDefault();
        console.log('住所欄ダブルクリック'); // デバッグ用
        postalModal.style.display = 'block';
        postalCode1.focus();
    });

    // 閉じるボタン
    closeBtn.addEventListener('click', function () {
        postalModal.style.display = 'none';
    });

    // モーダル外をクリックして閉じる
    document.addEventListener('click', function (e) {
        if (postalModal.style.display === 'block' && !postalModal.contains(e.target) && e.target !== toAddr) {
            postalModal.style.display = 'none';
        }
    });

    // 郵便番号の入力制限（数字のみ）
    [postalCode1, postalCode2].forEach((input, index) => {
        // 数字のみ入力制限
        input.addEventListener('input', function (e) {
            const oldValue = this.value;
            this.value = this.value.replace(/[^0-9]/g, '');
            if (oldValue !== this.value) {
                console.log(`郵便番号${index + 1}：数字以外を除去`); // デバッグ用
            }
        });

        // キー入力時の処理
        input.addEventListener('keydown', function (e) {
            // バックスペース、デリート、タブ、矢印キーなどは許可
            if ([8, 9, 27, 46, 37, 38, 39, 40].includes(e.keyCode) ||
                // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X を許可
                (e.ctrlKey === true && [65, 67, 86, 88].includes(e.keyCode))) {
                return;
            }

            // Enterキーで次の入力欄へ
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this === postalCode1 && postalCode1.value.length === 3) {
                    postalCode2.focus();
                } else if (this === postalCode2 && postalCode2.value.length === 4) {
                    lookupBtn.click();
                }
                return;
            }

            // 数字以外は入力を阻止
            if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
                console.log('数字以外の入力をブロック:', e.key); // デバッグ用
            }
        });

        console.log(`郵便番号入力${index + 1}：イベントリスナー設定完了`); // デバッグ用
    });

    // 住所検索ボタンのクリックイベント
    lookupBtn.addEventListener('click', async function () {
        const code1 = postalCode1.value;
        const code2 = postalCode2.value;
        console.log('住所検索開始:', code1, code2); // デバッグ用

        if (code1.length !== 3 || code2.length !== 4) {
            alert('郵便番号を正しく入力してください（例：123-4567）');
            console.log('郵便番号形式エラー'); // デバッグ用
            return;
        }

        const postalCode = code1 + code2;
        console.log('検索郵便番号:', postalCode); // デバッグ用

        try {
            lookupBtn.textContent = '検索中...';
            lookupBtn.disabled = true;

            // zipcloud APIを使用
            const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
            const data = await response.json();

            if (data.status === 200 && data.results && data.results.length > 0) {
                const result = data.results[0];
                const fullAddress = `〒${code1}-${code2}<br>${result.address1}${result.address2}${result.address3}`;
                toAddr.innerHTML = fullAddress;
                saveData();
                postalModal.style.display = 'none';
                // 入力欄をクリア
                postalCode1.value = '';
                postalCode2.value = '';
            } else {
                alert('該当する住所が見つかりませんでした。');
            }
        } catch (error) {
            console.error('住所検索エラー:', error);
            alert('住所検索でエラーが発生しました。');
        } finally {
            lookupBtn.textContent = '住所検索';
            lookupBtn.disabled = false;
        }
    });
}

// 初期化関数
function initializeAllFunctions() {
    console.log('全機能の初期化開始');

    try {
        initializeApp();
        console.log('アプリ初期化完了');
    } catch (e) {
        console.error('アプリ初期化エラー:', e);
    }

    try {
        setupHonorificSelector();
        console.log('敬称機能初期化完了');
    } catch (e) {
        console.error('敬称機能初期化エラー:', e);
    }

    try {
        setupPostalCodeLookup();
        console.log('郵便番号機能初期化完了');
    } catch (e) {
        console.error('郵便番号機能初期化エラー:', e);
    }

    try {
        render();
        console.log('レンダリング完了');
    } catch (e) {
        console.error('レンダリングエラー:', e);
    }
}

// DOMが完全に読み込まれてから初期化
document.addEventListener('DOMContentLoaded', initializeAllFunctions);

// もし既にDOMが読み込まれている場合（即座に実行）
if (document.readyState !== 'loading') {
    initializeAllFunctions();
}
