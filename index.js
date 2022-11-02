import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'


/*  
 *  Программа-пример для проигрывания .wav файлов с помощью стороннего плеера.
 *  Все найденные библиотеки не заработали, поэтому пришлось выкручиваться самому.
 *  Работа программы: создание папки /sound, сортировка файлов в папке, программа
 *  продолжит работать только с .wav форматом. Определение os для выбора стороннего
 *  плеера. Запуск скрипта, спавнящего неуправляемый процесс проигрывания заложенных
 *  файлов, выбранных в консоле нажатием буквы Y + Enter. Для пропуска нажмите Enter 
 *  не вводя ничего (или введите, всё кроме Y\y\н\Н будет проигнорированно). 
 * 
 *  метод построен на порождении дочернего процесса (https://en.wikipedia.org/wiki/Spawn_(computing))
 */ 

// --- Проверки наличия папки sound, а так же наличия файлов для проигрывания
console.log('--------------Folder check part start--------------------')
try {fs.readdirSync('./sound')}
catch {
    fs.mkdirSync('./sound')
    console.log('Please insert .wav audio files intro dir ./sound and run program another time');
    process.exit(0)
}

const audioFiles = fs.readdirSync('./sound')

if (audioFiles.length === 0) {
    console.log(audioFiles);
    console.log('Please insert .wav audio files intro dir ./sound and run program another time');
    process.exit(0)
}

let playableAudioFiles = []

// Отделяем .wav от других файлов
audioFiles.forEach((files)=>{
    //console.log(files);
    if (files.substring(files.length-4) === '.wav'){
        playableAudioFiles.push(files)
    }
})

console.log('To playing:')
console.log(playableAudioFiles)

console.log('--------------Folder check part ended--------------------')
// ---


// --- Проверка файла конфигурации, создание этого файла в случае его отсутствия
console.log('--------------Config part start--------------------------')
let config = {}
console.log('Checking config file...');
    configCreating: 
    if ( fs.existsSync ('./config.js') ) {
        console.log('Fetching existing config data...')
        config = fs.readFileSync('./config.js', 'utf-8')
        config = JSON.parse(config)
        if (config === '') {
            fs.rmSync('./config.js')
            throw new Error ('File config has empty, restart program to autocreate new one, current config was deleted.')
        }
    }
    else {
        // Опрашиваем os, с целью выяснить текущую операционную систему.
        // в планах на момент задумки только Windows и Termux
        console.log('Creating of config file...');

        // Определение операционной системы как Windows
        if (os.platform() === 'win32') {
            config.platform = 'win32'
            config.player = 'powershell'
            fs.writeFileSync('./config.js', JSON.stringify(config))
            break configCreating
        }

        if (os.platform() === 'android') {

            // Определение операционной системы как Termux запущенного на телефоне
            if (process.env.TERMUX_VERSION) {
                config.platform = 'termux'
                config.player = 'paplay'
                fs.writeFileSync('./config.js', JSON.stringify(config))
                break configCreating
            }
        }

        // В случае попытки запуска на других операционных системах. 
        // Если нужна их поддержка, нужно определить рабочий плеер в CLI
        // Затем создать тут фильтр для записи файла config.js 
        // Потом добавить найденный плеер в скрипт
        throw new Error (`Данная операционная система не поддерживается, Вы можете добавить её самостоятельно, либо попросить автора \n This OS don't have support yet, you can make it by you own, or ask author`)
    }
    console.log('Preparing is complite');
    console.table(config)

console.log('--------------Config part ended--------------------------')
// ---

// --- запуск скрипта 
console.log('--------------Script part start--------------------------')

const audioPlayerExec = ( Player, File = '',arg = {} ) => {
    exec((Player + ' ' + File, arg),
    (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
    });
}

const termuxPlay = (File) => {
    if (!File) {throw new Error ('Insert correct audio file name in powershellPlay function arguments')}
    execSync( `paplay ${path.resolve('./sound/' + File)}`,
    {  },
    (e,out,err)=>{
        if (e) throw e
        if (err) console.error(err)
        // console.log(out);   
    })
}

const powershellPlay = (File) => {
    if (!File) {throw new Error ('Insert correct audio file name in powershellPlay function arguments')}
    execSync((`($PlayWav = New-Object System.Media.SoundPlayer) -and  ($PlayWav.SoundLocation = "${path.resolve("./sound/" + File)}")  -and ($PlayWav.PlaySync())`),
    { 'shell':'powershell.exe' },
    (e,out,err)=>{
        if (e) throw e
        if (err) console.error(err)
        // console.log(out);
    })
}




//TODO добавить выбор в консоли с подтверждением, какой файл пользователь желает проиграть, а какие можно игнорировать

if (config.platform === 'win32') {
    if  (playableAudioFiles[0]) {
        playableAudioFiles.forEach((audioFile)=>{
            console.log('Now playing:' + audioFile);
            powershellPlay(audioFile);
        })
    } 
    else {
        console.log('Folder ./sound empty! Please insert .wav audio files intro dir ./sound and run program another time');
        process.exit()
    }  
}

if (config.platform === 'termux') {
    if  (playableAudioFiles[0]) {
        playableAudioFiles.forEach((audioFile)=>{
            console.log('Now playing:' + audioFile);
            termuxPlay(audioFile);
        })
    } 
    else {
        console.log('Folder ./sound empty! Please insert .wav audio files intro dir ./sound and run program another time');
        process.exit()
    }  
}


console.log('--------------Script part ended--------------------------')