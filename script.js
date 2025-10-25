const q = sel => document.querySelector(sel);
const fmt = (n, cur) => (cur || "¥") + Number(n || 0).toLocaleString();

// ACE CREATIONの固定情報
const ACE_CREATION = {
    name: '株式会社ACE CREATION',
    address: '〒615-0904<br />京都市右京区梅津堤上町21 KKハウスⅡ 101',
    tel: '080-9540-4451',
    regNo: 'T6130001080238'
};

// テーブルに行を追加する新しい関数
function addTableRow(kind) {
    const tbody = q('#p_' + kind);
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input class="editable-cell" placeholder="摘要" value="" /></td>
        <td class="right"><input class="editable-cell" type="number" step="1" placeholder="数量" value="" style="text-align:right" /></td>
        <td class="right"><input class="editable-cell" type="number" step="1" placeholder="単価" value="" style="text-align:right" /></td>
        <td class="right calculated-amount">¥0</td>
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
    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            updateRowAmount(row);
            calculateTotals();
            saveData();
        });

        // 単価フィールド（index 2）に¥マーク追加のイベントリスナー
        if (index === 2) {
            input.addEventListener('input', () => {
                addYenSymbolToInput(input, '単価');
            });
            input.addEventListener('blur', () => {
                addYenSymbolToInput(input, '単価');
            });
        }
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
    const qty = parseFloat(inputs[1].value || 0); // 数量が1番目に戻る
    const price = parseFloat(inputs[2].value || 0); // 単価が2番目に戻る
    const amount = qty * price;
    const amountCell = row.querySelector('.calculated-amount');
    amountCell.textContent = `¥${Number(amount || 0).toLocaleString()}`; // 金額に¥マークを追加

    // 単価フィールドに¥マークを追加
    const priceInput = inputs[2];
    addYenSymbolToInput(priceInput, '単価');
}

// 入力フィールドに¥マークを追加する関数
function addYenSymbolToInput(input, type) {
    if (!input || !input.parentElement) return;

    const parentTd = input.parentElement;
    if (parentTd.style.position !== 'relative') {
        parentTd.style.position = 'relative';
    }

    // 既存の¥マークを削除
    const existingSymbol = parentTd.querySelector('.yen-symbol');
    if (existingSymbol) {
        existingSymbol.remove();
    }

    // 値がある場合のみ¥マークを表示
    if (input.value) {
        const yenSymbol = document.createElement('span');
        yenSymbol.textContent = '¥';
        yenSymbol.className = 'yen-symbol';
        yenSymbol.style.position = 'absolute';
        yenSymbol.style.left = '4px';
        yenSymbol.style.top = '50%';
        yenSymbol.style.transform = 'translateY(-50%)';
        yenSymbol.style.pointerEvents = 'none';
        yenSymbol.style.color = '#000';  // 黒色に変更
        yenSymbol.style.fontSize = '14px';
        parentTd.appendChild(yenSymbol);
        input.style.paddingLeft = '18px';
    } else {
        input.style.paddingLeft = '';
    }
}

// 合計を計算
function calculateTotals() {
    const getTableTotal = (tableId) => {
        const rows = q('#' + tableId).querySelectorAll('tr');
        let total = 0;
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 3) { // 3列に変更
                const qty = parseFloat(inputs[1].value || 0); // 数量が1番目に戻る
                const price = parseFloat(inputs[2].value || 0); // 単価が2番目に戻る
                total += qty * price;
            }
        });
        return total;
    };

    const mainTotal = getTableTotal('p_main');
    const deductTotal = getTableTotal('p_deduct');

    const subtotal = mainTotal;
    const total = subtotal - deductTotal;

    q('#p_subtotal').textContent = `¥${Number(subtotal).toLocaleString()}`;
    q('#p_deductTotal').textContent = `¥${Number(deductTotal).toLocaleString()}`;
    q('#p_total').textContent = `¥${Number(total).toLocaleString()}`;

    // ご請求金額に合計を表示
    q('#p_billAmountDisplay').textContent = `¥${Number(total).toLocaleString()}（税込）`;
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
                    qty: parseFloat(inputs[1].value || 0), // 数量が1番目に戻る
                    price: parseFloat(inputs[2].value || 0) // 単価が2番目に戻る
                });
            }
        });
        return data;
    };

    return {
        main: getTableData('p_main'),
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
                <td class="right calculated-amount">¥0</td>
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
            inputs.forEach((input, index) => {
                input.addEventListener('input', () => {
                    updateRowAmount(row);
                    calculateTotals();
                    saveData();
                });

                // 単価フィールド（index 2）に¥マーク追加のイベントリスナー
                if (index === 2) {
                    input.addEventListener('input', () => {
                        addYenSymbolToInput(input, '単価');
                    });
                    input.addEventListener('blur', () => {
                        addYenSymbolToInput(input, '単価');
                    });
                }
            });

            tbody.appendChild(row);
            updateRowAmount(row);
        });
    };

    setTableData('p_main', data.main || []);
    setTableData('p_deduct', data.deduct || []);

    calculateTotals();
    updateAddButtonPositions(); // データ設定後にボタン位置を更新
}

// 追加ボタンの位置を更新する関数（もう使用しない - ボタンはセクションヘッダー内に固定）
function updateAddButtonPositions() {
    // ボタンは今やセクションヘッダー内に配置されているため、この関数は不要
    // 互換性のため空の関数として残す
}

// render関数
function render() {
    // 計算の更新のみ（初期値はsyncPartiesToInvoiceで設定される）
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
        // レンダリング完了を十分に待つ
        await new Promise(resolve => setTimeout(resolve, 500));

        // html2canvasでキャプチャ
        const canvas = await html2canvas(sheet, {
            scale: 4,              // 高解像度化（4倍）
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: sheet.scrollWidth,
            windowHeight: sheet.scrollHeight,
            width: sheet.scrollWidth,
            height: sheet.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            letterRendering: true,
            foreignObjectRendering: false,
            ignoreElements: (element) => {
                // ボタン要素を完全に無視
                return element.tagName === 'BUTTON' ||
                    element.classList.contains('btn') ||
                    element.classList.contains('add-btn') ||
                    element.classList.contains('add-row-btn');
            },
            onclone: (clonedDoc) => {
                // クローンされたドキュメントのスタイルを調整
                const clonedSheet = clonedDoc.querySelector('#sheet');
                if (clonedSheet) {
                    clonedSheet.style.width = '210mm';
                    clonedSheet.style.height = '297mm';
                    clonedSheet.style.transform = 'none';
                    clonedSheet.style.overflow = 'visible';
                }

                // すべてのボタンを非表示に
                const buttons = clonedDoc.querySelectorAll('button, .btn, .add-btn, .add-row-btn');
                buttons.forEach(btn => {
                    btn.style.display = 'none';
                    btn.style.visibility = 'hidden';
                });

                // セクション名の行の高さを微調整
                const sectionRows = clonedDoc.querySelectorAll('.section-row');
                sectionRows.forEach(row => {
                    row.style.height = 'auto';
                    row.style.lineHeight = '1.8';
                });

                // セクション名セルのパディングを調整
                const sectionCells = clonedDoc.querySelectorAll('.section-name-cell');
                sectionCells.forEach(cell => {
                    cell.style.paddingTop = '10px';
                    cell.style.paddingBottom = '10px';
                });

                // セクションヘッダーのコンテンツに余白を追加
                const sectionContents = clonedDoc.querySelectorAll('.section-header-content');
                sectionContents.forEach(content => {
                    content.style.paddingTop = '4px';
                    content.style.paddingBottom = '4px';
                });
            }
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');

        // 画像をA4サイズに正確にフィット
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
        toName: q('#p_toCompany')?.textContent || '',
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
        tableData: getDataFromTables(),

        // セクション選択データ
        sectionSelections: {
            main: document.querySelector('.section-select[data-section="main"]')?.value || 'Amazon'
        },

        // 請求先・請求元データ
        parties: {
            fromParty: q('#fromParty')?.value || ACE_CREATION.name,
            toParty: q('#toParty')?.value || ''
        }
    };
    localStorage.setItem('invoice_direct_edit_v1', JSON.stringify(data));
}


// 請求先・請求元の同期関数
function syncPartiesToInvoice() {
    const fromPartyInput = q('#fromParty');
    const toPartyInput = q('#toParty');

    if (!fromPartyInput || !toPartyInput) {
        console.warn('請求先・請求元の入力欄が見つかりません');
        return;
    }

    const fromParty = fromPartyInput.value || '';
    const toParty = toPartyInput.value || '';

    // 請求先（to）を更新
    const toCompanyElem = q('#p_toCompany');
    const toAddrElem = q('#p_toAddr');

    if (toCompanyElem && toAddrElem) {
        if (toParty === ACE_CREATION.name) {
            // ACE CREATIONが請求先の場合
            toCompanyElem.textContent = ACE_CREATION.name;
            toAddrElem.innerHTML = ACE_CREATION.address;
            // 請求元のplaceholderを空にする
            fromPartyInput.placeholder = '';
        } else {
            // 通常の請求先
            toCompanyElem.textContent = toParty;
            toAddrElem.innerHTML = toParty ? '' : ''; // 空欄に
            // 請求元のplaceholderを復元
            fromPartyInput.placeholder = '株式会社ACE CREATION';
        }
    }

    // 請求元（from）を更新
    const fromNameElem = q('#p_fromName');
    const fromAddrElem = q('#p_fromAddr');
    const fromTelElem = q('#p_fromTel');
    const fromRegElem = q('#p_fromReg');

    if (fromNameElem && fromAddrElem && fromTelElem && fromRegElem) {
        if (fromParty === ACE_CREATION.name) {
            // ACE CREATIONが請求元の場合（通常ケース）
            fromNameElem.textContent = ACE_CREATION.name;
            fromAddrElem.innerHTML = ACE_CREATION.address;
            fromTelElem.textContent = ACE_CREATION.tel;
            fromRegElem.textContent = ACE_CREATION.regNo;

            // 請求先の住所を空欄に（ACE CREATIONでない場合）
            if (toParty !== ACE_CREATION.name && toAddrElem) {
                // 既存の住所を保持（手動編集されている可能性があるため）
                if (!toAddrElem.innerHTML.trim() || toAddrElem.innerHTML === ACE_CREATION.address) {
                    toAddrElem.innerHTML = '〒<br />（住所）';
                }
            }

            // 請求先のplaceholderを復元
            toPartyInput.placeholder = '株式会社';
        } else {
            // 他社が請求元の場合
            fromNameElem.textContent = fromParty;
            fromAddrElem.innerHTML = '';
            fromTelElem.textContent = '';
            fromRegElem.textContent = '';

            // 請求先のplaceholderを空にする
            toPartyInput.placeholder = '';
        }
    }

    saveData();
}

// 請求先と請求元を入れ替える関数
function swapParties() {
    const fromPartyInput = q('#fromParty');
    const toPartyInput = q('#toParty');

    if (!fromPartyInput || !toPartyInput) return;

    // readonlyを一時的に解除してから値を入れ替え
    fromPartyInput.readOnly = false;
    toPartyInput.readOnly = false;

    // 値を入れ替え
    const temp = fromPartyInput.value;
    fromPartyInput.value = toPartyInput.value || '';
    toPartyInput.value = temp;

    // 請求書に反映と編集可否を更新
    syncPartiesToInvoice();
    updateInputStates();
}

// 入力欄の編集可否を制御
function updateInputStates() {
    const fromPartyInput = q('#fromParty');
    const toPartyInput = q('#toParty');

    if (fromPartyInput && toPartyInput) {
        // ACE CREATIONが入っている方は常に編集不可
        if (fromPartyInput.value === ACE_CREATION.name) {
            // ACE CREATIONが請求元の場合
            fromPartyInput.readOnly = true;
            fromPartyInput.style.backgroundColor = '#f5f5f5';
            fromPartyInput.style.cursor = 'not-allowed';

            toPartyInput.readOnly = false;
            toPartyInput.style.backgroundColor = '#fff';
            toPartyInput.style.cursor = 'text';
        } else if (toPartyInput.value === ACE_CREATION.name) {
            // ACE CREATIONが請求先の場合
            toPartyInput.readOnly = true;
            toPartyInput.style.backgroundColor = '#f5f5f5';
            toPartyInput.style.cursor = 'not-allowed';

            fromPartyInput.readOnly = false;
            fromPartyInput.style.backgroundColor = '#fff';
            fromPartyInput.style.cursor = 'text';
        }
    }
}

// キーボード入力も完全にブロック
function preventAceCreationEdit(e) {
    const input = e.target;
    if (input.value === ACE_CREATION.name) {
        e.preventDefault();
        return false;
    }
}

// 請求先・請求元入力欄のイベントリスナー
function setupPartiesListeners() {
    const fromPartyInput = q('#fromParty');
    const toPartyInput = q('#toParty');
    const swapBtn = q('#swapPartiesBtn');

    if (fromPartyInput) {
        fromPartyInput.addEventListener('keydown', preventAceCreationEdit);
        fromPartyInput.addEventListener('keypress', preventAceCreationEdit);
        fromPartyInput.addEventListener('paste', preventAceCreationEdit);
        fromPartyInput.addEventListener('input', () => {
            syncPartiesToInvoice();
            updateInputStates();
        });
    }

    if (toPartyInput) {
        toPartyInput.addEventListener('keydown', preventAceCreationEdit);
        toPartyInput.addEventListener('keypress', preventAceCreationEdit);
        toPartyInput.addEventListener('paste', preventAceCreationEdit);
        toPartyInput.addEventListener('input', () => {
            syncPartiesToInvoice();
            updateInputStates();
        });
    }

    if (swapBtn) {
        swapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            swapParties();
        });
    }

    updateInputStates();
}

// イベントリスナー設定
q('#pdfBtn').onclick = downloadPDF;
q('#printBtn').onclick = () => window.print();

// 初期化関数
function initializeApp() {
    // 固定値を設定
    q('#p_greeting').textContent = '下記の通りご請求申し上げます。';

    // 初期値を設定
    if (!q('#p_subject').textContent.trim()) {
        q('#p_subject').textContent = '2025年8月稼働分';
    }

    // イベントリスナーを設定
    setupEditListeners();
    setupSectionSelectors();
    setupPartiesListeners();

    // 初期同期
    syncPartiesToInvoice();
    updateInputStates();

    // 初期テーブル行を追加
    addTableRow('main');
    addTableRow('deduct');

    calculateTotals();
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

// セクション選択機能を設定
function setupSectionSelectors() {
    const sectionSelectors = document.querySelectorAll('.section-select');
    sectionSelectors.forEach(select => {
        select.addEventListener('change', saveData);
    });
}

// 敬称選択機能（クリック切り替え式）
function setupHonorificSelector() {
    setTimeout(() => {
        const honorificClickable = document.getElementById('p_honorific_clickable');
        if (!honorificClickable) return;

        let currentHonorific = honorificClickable.textContent.trim() || '御中';

        honorificClickable.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            currentHonorific = currentHonorific === '御中' ? '様' : '御中';
            this.textContent = currentHonorific;
            saveData();
            return false;
        };

        honorificClickable.onmouseenter = function () {
            this.style.backgroundColor = '#f0f8ff';
        };

        honorificClickable.onmouseleave = function () {
            this.style.backgroundColor = 'transparent';
        };
    }, 100);
}


// 初期化
function initialize() {
    initializeApp();
    setupHonorificSelector();
    render();
}

// DOMロード時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
