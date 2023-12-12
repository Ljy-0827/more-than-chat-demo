let rects = [];
let isDragging = false;
let xOffset, yOffset;
let selectedRect = null;

let roleRectColor = '#C1E9FF';
let descriptionRectColor = '#FFE4E4';
let resultRectColor = '#CCF8E3';
let actionRectColor = '#FFE9AF';

let actionNum = 3;
let outputBlockNum = 1;
let resultFormatArray = [];
let resultFormatJSON = {};
let resultFormatString = '';

let descriptionData = '';
let roleData = '';
let actionData = '';

// hover调整矩形大小相关变量
let hoverRect = null;
let onBorder = false;
let onLeftBorder = false;
let onRightBorder = false;
let onTopBorder = false;
let onBottomBorder = false;


let generateButtonScale = 1.0; // 初始缩放比例

const p5gpt = new P5GPT();

function setup() {
    createCanvas(windowWidth, windowHeight);

    // 添加中间过程
    addActionButton = createButton('添加中间过程')
    addActionButton.position(72,48)
    addActionButton.size(100,50)
    addActionButton.mouseClicked(addAction);
    addActionButton.elt.style.zIndex = "2";

    // 添加输出结果
    addOutputButton = createButton('添加输出结果')
    addOutputButton.position(72, 108)
    addOutputButton.size(100,48)
    addOutputButton.mouseClicked(addOutputBlock);
    addOutputButton.elt.style.zIndex = "2";


    //生成故事按钮
    generateButton = createButton('生成故事');
    generateButton.position(910, 50);
    generateButton.size(100, 104);
    generateButton.mouseClicked(generateStory);

    //新增内容待拖拽区
    newRectArea = createDiv(`<div style="width: 828px; height: 140px; border: dashed 2px gray" ></div>`)
    newRectArea.position(50, 30);

    //内容矩形定义 & init
    rects = [
        {x: 50, y: 250, width: 160, height: 100, text: '输入您的角色', type: 'roleRect', label: '角色', input: null, id: `role`},
        {x: 240, y: 250, width: 770, height: 100, text: '输入任务描述', type: 'descriptionRect', label: '任务描述', input: null, id: 'description'},
        {x: 50, y: 400, width: 300, height: 100, text: '输入故事的中间过程', type: 'actionRect', label: '中间过程', input: null, id: 'action1'},
        {x: 380, y: 400, width: 300, height: 100, text: '输入故事的中间过程', type: 'actionRect', label: '中间过程', input: null, id: 'action2'},
        {x: 710, y: 400, width: 300, height: 100, text: '输入故事的中间过程', type: 'actionRect', label: '中间过程', input: null, id: 'action3'},
        {x: 50, y: 550, width: 960, height: 200, text: '', type: 'resultRect', label: '结果', input: null, id: 'output1'}]
}


function addAction(){
    actionNum ++;
    rects.push({x: 240, y: 62, width: 300, height: 100, text: '输入故事的中间过程', type: 'actionRect', label: '中间过程', input: null, id: `action${actionNum}`})
}

function addOutputBlock(){
    outputBlockNum ++;
    rects.push({x: 240, y: 62, width: 300, height: 100, text: '', type: 'resultRect', label: '输出结果', input: null, id:`output${outputBlockNum}`})
}

function generateStory(){
    // clear all
    actionData = '';
    roleData = '';
    descriptionData = '';
    resultFormatArray = [];
    resultFormatJSON = {};
    resultFormatString = '';

    // 按钮效果
    generateButton.html('生成中');
    let scaleAnimation = setInterval(() => {
        generateButtonScale = generateButtonScale === 1.0 ? 1.05 : 1.0; // 切换缩放比例
        generateButton.style('transform', `scale(${generateButtonScale})`);
    }, 500); // 500毫秒缩放切换的时间间隔


    //role, description, action
    for (let rectObj of rects) {
        if (rectObj.id === 'role' && rectObj.text){
            roleData = rectObj.text;
        } else if (rectObj.id === 'description' && rectObj.text) {
            descriptionData = rectObj.text;
        } else if (rectObj.text) {
            if(actionData === ''){
                actionData += `【${rectObj.label}：${rectObj.text}】`
            }else{
                actionData += `、【${rectObj.label}：${rectObj.text}】`
            }

        }
    }
    // console.log(actionData);

    // 将输出框的label整合调整为assistant prompt
    for (let rectObj of rects) {
        if (rectObj.type === 'resultRect' && rectObj.label) {
            resultFormatArray.push(rectObj.label);
        }
    }

    resultFormatArray.forEach(key => {
        resultFormatJSON[key] = '';
    });

    resultFormatString = resultFormatArray.join('、');

    console.log(resultFormatString);

    let systemPrompt = '你的角色是【' + roleData + '】';

    console.log('systemPrompt: ', systemPrompt);

    let userPrompt =  '，你的任务是【' + descriptionData + '】，生成的内容需要包括：' + actionData + '，结果需要包括且只能包括：' + resultFormatString + '，请通过以下格式输出最终的结果：' + JSON.stringify(resultFormatJSON);

    console.log(systemPrompt, userPrompt);

    // 调用 P5GPT 的 dialog 方法
    p5gpt.dialog(systemPrompt, userPrompt)
        .then(response => {
            // 处理 ChatGPT 的回复，你可以在这里做任何你想要的操作
            console.log(response);
            let responseJSON = JSON.parse(response);
            console.log("parsed:", responseJSON)

            for (let key in responseJSON) {
                // 查找对应的 rectObj
                console.log(key);
                let rectObj = rects.find(obj => obj.label === key && obj.type === 'resultRect');

                // 如果找到了对应的 rectObj
                if (rectObj) {
                    const outputRect = document.getElementById(rectObj.id);
                    outputRect.innerText = responseJSON[key];
                }
            }

            clearInterval(scaleAnimation); // 停止缩放动画
            generateButton.style('transform', ''); // 恢复按钮缩放为原始状态
            generateButton.html('生成故事');

        })
        .catch(error => {
            clearInterval(scaleAnimation); // 停止缩放动画
            generateButton.style('transform', ''); // 恢复按钮缩放为原始状态
            generateButton.html('生成故事');

            console.error(error);
        });


}

function mousePressed() {
    for(let rectObj of rects) {
        if(mouseX > rectObj.x - 5 &&
            mouseX < rectObj.x + rectObj.width + 5 &&
            mouseY > rectObj.y - 5 &&
            mouseY < rectObj.y + rectObj.height + 5)
        {
            isDragging = true;
            selectedRect = rectObj;
            xOffset = mouseX - rectObj.x;
            yOffset = mouseY - rectObj.y;
            break;
        }
    }
}

function mouseMoved(){
    hoverRect = null;
    onBorder = false;
    onLeftBorder = false;
    onRightBorder = false;
    onTopBorder = false;
    onBottomBorder = false;
    for (let rectObj of rects) {
        if (mouseX > rectObj.x - 5 && mouseX < rectObj.x + rectObj.width + 5 &&
            mouseY > rectObj.y - 5 && mouseY < rectObj.y + rectObj.height + 5)
        {
            hoverRect = rectObj;

            if (mouseX > rectObj.x && mouseX < rectObj.x + rectObj.width) {
                onTopBorder = mouseY > rectObj.y - 5 && mouseY < rectObj.y + 5;
                onBottomBorder = mouseY > rectObj.y + rectObj.height - 5 && mouseY < rectObj.y + rectObj.height + 5;
            }

            if (mouseY > rectObj.y && mouseY < rectObj.y + rectObj.height) {
                onLeftBorder = mouseX > rectObj.x - 5 && mouseX < rectObj.x + 5;
                onRightBorder = mouseX > rectObj.x + rectObj.width - 5 && mouseX < rectObj.x + rectObj.width + 5;
            }

            onBorder = onLeftBorder || onRightBorder || onTopBorder || onBottomBorder;

            if (onLeftBorder || onRightBorder) {
                cursor(CROSS);
            } else if (onTopBorder || onBottomBorder) {
                cursor(CROSS);
            } else {
                cursor();
            }

            break;
        } else {
            cursor();
        }
    }
}

function mouseDragged() {
    if (isDragging) {
        if(hoverRect && onBorder){
            if (onLeftBorder) {
                selectedRect.width = selectedRect.x - mouseX + selectedRect.width;
                selectedRect.x = mouseX;
            } else if (onRightBorder) {
                selectedRect.width = mouseX - selectedRect.x;
            }

            if (onTopBorder) {
                selectedRect.height = selectedRect.y - mouseY + selectedRect.height;
                selectedRect.y = mouseY;
            } else if (onBottomBorder) {
                selectedRect.height = mouseY - selectedRect.y;
            }
        }else{
            selectedRect.x = mouseX - xOffset;
            selectedRect.y = mouseY - yOffset;
        }
    }
}

function mouseReleased() {
    isDragging = false;
    selectedRect = null;
}

function draw() {
    background(250);
    for (let rectObj of rects) {
        if(rectObj.type === 'roleRect'){
            fill(roleRectColor);
        }else if(rectObj.type === 'descriptionRect'){
            fill(descriptionRectColor);
        }else if(rectObj.type === 'actionRect'){
            fill(actionRectColor);
        }else if(rectObj.type === 'resultRect'){
            fill(resultRectColor);
        }
        strokeWeight(1);
        stroke(0);
        rect(rectObj.x, rectObj.y, rectObj.width, rectObj.height);

        // 计算文本框的位置，使其在长方形内，比长方形小10像素
        let inputX = constrain(rectObj.x + 10, 0, width - rectObj.width - 20);
        let inputY = constrain(rectObj.y + 10, 0, height - rectObj.height - 20);
        let inputWidth = rectObj.width - 28;
        let inputHeight = rectObj.height - 26;

        // 创建或更新文本框，并将其置于长方形之上
        if(rectObj.input){
            rectObj.input.position(inputX, inputY);
            rectObj.input.size(inputWidth, inputHeight);
        }else{
            rectObj.input = createDiv(`<textarea style="height: 100%; width: 100%; border: none; background-color: transparent; outline: none; resize:none; " id="${rectObj.id}" placeholder="${rectObj.text}"></textarea>`);
            rectObj.input.position(inputX, inputY);
            rectObj.input.elt.style.zIndex = "1";
            // 添加事件监听器监听文本变化
            rectObj.input.elt.querySelector('textarea').addEventListener('input', function() {
                rectObj.text = this.value;
            });
        }

        //计算标题的位置
        if(rectObj.type !== 'resultRect' && rectObj.type !== 'actionRect'){
            let labelX = rectObj.x;
            let labelY = rectObj.y - 23;

            // 创建或更新不可编辑文本
            if (rectObj.labelElement) {
                rectObj.labelElement.position(labelX, labelY);
            } else {
                rectObj.labelElement = createDiv(rectObj.label);
                rectObj.labelElement.style('font-size: 13px;')
                rectObj.labelElement.position(labelX, labelY);
                rectObj.labelElement.elt.style.zIndex = "1";
            }
        }else if((rectObj.type === 'resultRect' || rectObj.type === 'actionRect') && rectObj.label){
            let inputLabelX = rectObj.x;
            let inputLabelY = rectObj.y - 25;

            if(rectObj.inputLabelElement){
                rectObj.inputLabelElement.position(inputLabelX, inputLabelY)
            }else{
                rectObj.inputLabelElement = createInput();
                rectObj.inputLabelElement.position(inputLabelX, inputLabelY);
                rectObj.inputLabelElement.elt.style.background = "transparent";
                rectObj.inputLabelElement.elt.style.border = "none";
                rectObj.inputLabelElement.elt.style.outline = "none";
                rectObj.inputLabelElement.size(rectObj.width - 20, 20);
                rectObj.inputLabelElement.value(rectObj.label);

                rectObj.inputLabelElement.input(function() {
                    rectObj.label = this.value();
                });
            }
        }
    }
}

