# WASM-demo

## Приложение для сравнения производительности работы WebAssembly и нативного JavaScript


### Общее описание

WASM-demo — это демонстрационное приложение, позволяющее сравнить производительность и принципы работы двух подходов к обработке изображений:

1. Через WebAssembly (WASM), скомпилированный из C++ кода с использованием [Emscripten](https://emscripten.org/);
2. Через чистый JavaScript.

Оба модуля выполняют инвертирование цветов BMP-изображения и отображают:

* Исходное изображение;
* Обработанное изображение;
* Время обработки изображения.

Приложение позволяет не только вручную протестировать работу модулей, но и запустить автоматическое тестирование c помощью [Puppeteer](https://pptr.dev/).

> В режиме автоматического тестирования приложение поочерёдно обрабатывает все изображения, находящиеся в папке `images`. Для каждого изображения выводится время, затраченное на его обработку. При этом из расчёта исключаются только те изображения, чьё время обработки превышает среднее более чем на два стандартных отклонения — отклонения в меньшую сторону не учитываются как выбросы.

### Предварительная подготовка
1. Установка необходимых npm-пакетов:
```
npm install
```
2. Установка компилятора [Emscripten](https://emscripten.org/). Убедиться, что компилятор установлен корректно, можно с помощью команды:
```
emcc -v
```
> Если `emcc` при установке не был добавлен в системные переменные, перед компиляцией следует выполнить команды, описанные ниже в разделе "Дополнительная настройка emcc"
3. Компиляция wasm-модуля:
```
emcc wasm/cpp/invert.cpp -o wasm/compiled/invert.js -O3 -sEXPORTED_FUNCTIONS="['_analyze_image', '_invert_colors', '_malloc', '_free']" -sEXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'HEAPU8']" -sALLOW_MEMORY_GROWTH
```
4. Следует подготовить набор .bmp-файлов, которые будут преобразовываться в ходе работы приложения. Эти файлы следует поместить в папку `./images`. Для минимального тестирования в папке уже находится 3 изображения, однако рекомендуется использовать большее количество файлов.

### Дополнительная настройка emcc: 

Если `emcc` не был добавлен в системные переменные, перед компиляцией следует выполнить следующие команды:

> `C:\emsdk\emsdk` следует заменить на путь до скачанного Вами компилятора

1. Скачать и установить последнюю версию Emscripten SDK (компилятор + инструменты):
```
C:\emsdk\emsdk install latest
```
2. Активировать установленную версию SDK:
```
C:\emsdk\emsdk activate latest
```
3. Загрузить переменные окружения в текущую PowerShell-сессию:
```
C:\emsdk\emsdk_env.ps1
```

### Запуск приложения и тестирование

#### WASM-модуль

1. Запуск сервера:
```
npm run wasm-start
```
2. Приложение доступно по адресу (можно протестировать вручную):
```
http://localhost:3000
```
3. Запуск автоматических тестов:
```
npm run test wasm
```

* Также можно одновременно запустить сервер и автоматические тесты:
```
npm run wasm
```

#### JavaScript-модуль

1. Запуск сервера:
```
npm run js-start
```
2. Приложение доступно по адресу (можно протестировать вручную):
```
http://localhost:3000
```
3. Запуск автоматических тестов:
```
npm run test js
```

* Также можно одновременно запустить сервер и автоматические тесты:
```
npm run js
```

Более подробная информация о каждом из модулей приложения доступна в соответствующих файлах:

* WASM - `./wasm/README.md`
* JavaScript - `./javascript/README.md`