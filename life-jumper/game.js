let instructions = "Use AD to move and W/Space to jump.";

let platformGroups = [];

function getNewPlatformGroupData(index){
    return {
        index: index,
        upperPlatformLanded: false,
        lowerPlatformLanded: false,
    }
}

const playerConfig = {
    horizontalSpeed: 5,
    jumpHeight: 10,
    horizontalAccer: 1,
    verticalAccer: 0.1,
    damp: 0.7,
};

const platformConfig = {
    width: 150,
    height: 30,
    collider: "static",
    xGap: 300,
    yGap: 100,
};

const cameraOffset = {
    x: 150,
    y: 50,

};

const PlayerStatus = {
    AIR: 'air',
    GROUNDED: 'grounded',
    JUMPING: 'jumping',
    LANDING: 'landing'
};

let player, groundSensor;
let platformGroup;
let novelPrompt = "你是一个小说家，你在写一个忧郁的青春期男孩夏天的故事，你会根据故事的上文对小说进行续写，请你每次只续写之后一天的故事，故事大概率表现夏天忧郁的心情，小概率心情不错，每天故事不超过20个字。以日期：故事的格式撰写，故事的上文为：";

let gptAgent = new p5GPT();
let novelResult = "";
let novelResultTmp = "";
let novelResultNextdayTmp = "";
let showNovel = 0;
let showNovelSpeed = 9;
let showNovelTodayIndex = 0;
let playerGrounded = true;
let playerGroundedLastFrame = true;
let playerJumpStartX = 0;
let playerJumpEndX = 0;


function createPlatformGroup(upPlatform, downPlatform) {
    const xLeft = min(upPlatform.position.x, downPlatform.position.x);
    const xRight = max(upPlatform.position.x + upPlatform.width, downPlatform.position.x + downPlatform.width);
    const upPlatformTop = upPlatform.position.y - upPlatform.height / 2;
    const upPlatformBottom = upPlatform.position.y + upPlatform.height / 2;
    const downPlatformTop = downPlatform.position.y - downPlatform.height / 2;
    const downPlatformBottom = downPlatform.position.y + downPlatform.height / 2;

    return {
        upPlatform: upPlatform,
        downPlatform: downPlatform,
        xLeft: xLeft,
        xRight: xRight,
        upPlatformTop: upPlatformTop,
        upPlatformBottom: upPlatformBottom,
        downPlatformTop: downPlatformTop,
        downPlatformBottom: downPlatformBottom,
        landed: false,
    };
}

function getPlayerStatus(){
    if (playerGrounded && playerGroundedLastFrame) return PlayerStatus.GROUNDED;
    else if (playerGrounded && !playerGroundedLastFrame) return  PlayerStatus.LANDING;
    else if (!playerGrounded && playerGroundedLastFrame) return PlayerStatus.JUMPING;
    else return PlayerStatus.AIR;

}

function getNewPlatformData() {
    return {
        landed: false,
    };
}

/*
function createNextTwoOption(lastX, lastY) {
    let index = platformGroups.length;
    // up platform
    let up = new Sprite(
        lastX + platformConfig.xGap+ 40*Math.random()-20,
        lastY - platformConfig.yGap+ 40*Math.random()-20,
        platformConfig.width,
        platformConfig.height,
        platformConfig.collider
    );
    up.data = getNewPlatformData();
    platformGroup.push(up);

    // down platform
    let down = new Sprite(
        lastX + platformConfig.xGap + 40*Math.random()-20,
        lastY + platformConfig.yGap+ 40*Math.random()-20,
        platformConfig.width,
        platformConfig.height,
        platformConfig.collider
    );
    down.data = getNewPlatformData();
    platformGroup.push(down);
    platformGroups.push(getNewPlatformGroupData(index));
    console.log(platformGroup);
    console.log(platformGroups);
}

 */

function createNextTwoOption(lastX, lastY) {
    // up platform
    let up = new Sprite(
        lastX + platformConfig.xGap + 40 * Math.random() - 20,
        lastY - platformConfig.yGap + 40 * Math.random() - 20,
        platformConfig.width,
        platformConfig.height,
        platformConfig.collider
    );
    up.data = getNewPlatformData();
    platformGroup.push(up);

    // down platform
    let down = new Sprite(
        lastX + platformConfig.xGap + 40 * Math.random() - 20,
        lastY + platformConfig.yGap + 40 * Math.random() - 20,
        platformConfig.width,
        platformConfig.height,
        platformConfig.collider
    );
    down.data = getNewPlatformData();
    platformGroup.push(down);

    // 创建 platformGroup 对象并加入数组
    const group = createPlatformGroup(up, down);
    platformGroups.push(group);
    console.log(platformGroups)
}


async function setup() {
    new Canvas(800, 600);

    const playerConfig = {
        spawnX: width * 0.3,
        spawnY: height * 0.5 - 200,
        width: 30,
        height: 30,
    };

    world.gravity.y = 10;

    platformGroup = new Group();
    // first platform
    let firstPlatform = new Sprite(
        width * 0.3,
        height * 0.5,
        platformConfig.width,
        platformConfig.height,
        platformConfig.collider
    );
    firstPlatform.data = getNewPlatformData();
    platformGroup.push(firstPlatform);


    player = new Sprite(playerConfig.spawnX, playerConfig.spawnY, playerConfig.width, playerConfig.height);
    player.rotationLock = true;

    // ground Sensor and stick to the player by joint
    groundSensor = new Sprite(playerConfig.spawnX, playerConfig.spawnY + playerConfig.height / 2, 10, 10);
    groundSensor.mass = 0.01;
    groundSensor.visible = true;
    groundSensor.overlaps(allSprites);
    new GlueJoint(player, groundSensor);
    textAlign(CENTER);

    // setup player-Platform collision
/*
    player.collides(platformGroup, async (player, platform) => {
        const playerTopEdge = player.position.y - player.height / 2;
        const platformTopEdge = platform.position.y - platform.height / 2;

        if (!platform.data.landed && playerTopEdge <= platformTopEdge) {
            // Only generate a new platform if the player collides with the top edge of the platform
            platform.data.landed = true;
            createNextTwoOption(platform.x, platform.y);
            let promptNextday = novelPrompt + "," + novelResult;
            novelResultNextdayTmp = await gptAgent.single(promptNextday);  // 预先更新下一天的小说结果
        }
        player.vel.y = 0; // 防止弹跳
    });

 */


    // for test

    let input, button;
    const testGPT = () => {
        const prompt = input.value();
        input.value("");
        let res = gptAgent.single(prompt);
        console.log(res);
        text(res,width / 2, 120);
    };

    const testGPTInput = () => {
        input = createInput();
        input.position(20, 65);

        button = createButton("submit");
        button.position(input.x + input.width, 65);
        button.mousePressed(testGPT);
    };


    testGPTInput();
    novelResult = "2022年10月23日：夏天感到自己像是一个被遗忘的角色，演绎着一场无声的孤独戏。"; // update novel
    let promptNextday = novelPrompt + novelResult;
    console.log(promptNextday);
    novelResultNextdayTmp = await gptAgent.single(promptNextday); // 预先更新下一天的小说结果
    console.log(novelResultNextdayTmp);
    createNextTwoOption(firstPlatform.x, firstPlatform.y);
}

async function draw() {
    background(205);
    text(instructions, width / 2, 20);
    text(novelResult.substring(0,showNovel/showNovelSpeed), width/2, 80);
    playerGroundedLastFrame = playerGrounded;
    playerGrounded = groundSensor.overlapping(platformGroup);

    if (kb.pressing("left")) {
        player.vel.x -= playerConfig.horizontalAccer;
    } else if (kb.pressing("right")) {
        player.vel.x += playerConfig.horizontalAccer;
    } else {
        player.vel.x *= playerConfig.damp ;
    }
    if (player.vel.x < -playerConfig.horizontalSpeed) player.vel.x = -playerConfig.horizontalSpeed;
    else if (player.vel.x > playerConfig.horizontalSpeed) player.vel.x = playerConfig.horizontalSpeed;

    if (kb.pressing("up") || kb.pressing("space")) {
        if (getPlayerStatus() === PlayerStatus.GROUNDED){
            player.vel.y = -playerConfig.jumpHeight;
        }


    }


    if (getPlayerStatus() === PlayerStatus.JUMPING){
        playerJumpStartX = player.x;

    }



    if (getPlayerStatus() === PlayerStatus.LANDING){
        console.log(2)
        playerJumpEndX = player.x;

        console.log("novelResult.length:", novelResult.length);
        console.log("showNovel:", showNovel);

        if (showNovel > novelResult.length * showNovelSpeed )
        {
             console.log("yes1");
            if (playerJumpEndX - playerJumpStartX > platformConfig.width)
            {
                console.log("yes");
                showNovelTodayIndex = showNovel ;
                novelResult = novelResult + '\n' + novelResultNextdayTmp;
                console.log("novelResult: ", novelResult);

            }


        }

            const playerX = player.position.x + platformConfig.width / 2;

            // 遍历所有 platformGroups 进行碰撞检测
            for (let i = 0; i < platformGroups.length; i++) {
                const currentGroup = platformGroups[i];
                // 判断玩家是否在当前 platformGroup 范围内
                if (playerX >= currentGroup.xLeft && playerX <= currentGroup.xRight) {
                    // 在当前 platformGroup 上执行碰撞检测逻辑

                    player.collides(currentGroup.upPlatform, async (player, platform) => {
                        // 处理碰撞发生时的逻辑
                        if (!currentGroup.landed) {
                            console.log("碰撞上平台");
                            currentGroup.landed = true;
                            let promptNextday = novelPrompt + novelResultNextdayTmp;
                            console.log("prompt: ", promptNextday);
                            novelResultNextdayTmp = await gptAgent.single(promptNextday); // 预先更新下一天的小说结果
                            console.log(novelResultNextdayTmp)
                            createNextTwoOption(currentGroup.xRight, currentGroup.upPlatformTop);
                        }
                        player.vel.y = 0; // 防止弹跳
                    });

                    player.collides(currentGroup.downPlatform, async (player, platform) => {
                        // 处理碰撞发生时的逻辑（如果需要的话）
                        if (!currentGroup.landed) {
                            console.log("碰撞下平台");
                            currentGroup.landed = true;
                            let promptNextday = novelPrompt + novelResultNextdayTmp;
                            console.log("prompt: ", promptNextday);
                            novelResultNextdayTmp = await gptAgent.single(promptNextday); // 预先更新下一天的小说结果
                            console.log(novelResultNextdayTmp)
                            createNextTwoOption(currentGroup.xRight, currentGroup.downPlatformBottom);
                        }
                        player.vel.y = 0; // 防止弹跳
                    });

                    // 当前 platformGroup 已经找到，结束循环
                    break;
                }
            }


    }


    if (getPlayerStatus() === PlayerStatus.AIR){
        player.vel.y += playerConfig.verticalAccer;
        showNovel++;
    }

    // camera follow player
    camera.x = player.x+cameraOffset.x;
    camera.y = player.y+cameraOffset.y;

}