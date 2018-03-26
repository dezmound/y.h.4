[![Build Status](https://travis-ci.org/dezmound/y.h.4.svg?branch=dev)](https://travis-ci.org/dezmound/y.h.4)   

**README #8**     

Ссылка на репозиторий, отображаемый в приложении: [GitHub Local Repo](https://github.com/dezmound/y.h.3)   
Heroku Dev App: [Heroku Dev](https://shri-h-4-dev.herokuapp.com)   
Heroku App: [Heroku App](https://shri-h-4.herokuapp.com)    

**Source Map:**    
```
controllers/
└── mainController.js // Обрабатывает запросы по роуту /:path
modules/
└── git
    └── index.js // Модуль для работы с Git CLI
router/
└── index.js // Роутер приложения
src/
├── css
│   └── main.css // Базовые стили
└── js
    └── entry.js // Базоый js
test/
├── integrations
│   └── testGit.js // Интеграционные тесты Git CLI
└── unit
    └── testGit.js // Модульные тесты Git CLI со стабами
utils/
└── StreamCollector.js // Класс для сборки данных потока в буфер.
views/
├── blob.pug
├── breadcrumbs.pug
├── directory.pug
├── index.pug
└── not_found.pug

```

Основаня логика работы с Git CLI расположена   
в классе `Git:modules/git/index.js`.
В нем реализованы базоывае операции в `Git`, такие как:
```javascript
Git::init() // инициализция репозитория
Git::commit()  // коммит
Git::add()  // добавление файлов в коммит
Git::checkout(ref) // переключение ветки
Git::branch(ref) // переключение / вывод текущей ветки
Git::branches(ref) // получения списка веток
Git::fileStructure(ref) // получения списка файлов по ссылке Git
Git::open(ref)  // получение содержимого объекта п ссылке.
                // если директория или коммит - вернет fileStructure,
                // если файл - содержимое.
Git::contains(ref) // получает содержимое объекта по ссылке
Git::thisIs(ref) // получения типа объекта по ссылке (tree, blob, commit)
```

**Касаемо инфраструктуры:**     

Конфигурация приложеня лежит в файле: `./config.js`.

Собрал образ по базовому образу `node:alpine`,
выбрал его потому что он достаточно легковесный.
Пришлось установить сверху git, для интеграционных тестов.
Приложение принимает порт, на котором оно должно работать
через переменную окруженя `$PORT`.

`TravisCI` деплоит приложение `shri-h-4-dev` по   
пушу в ветку dev и в приложение `shri-h-4` по пушу в мастер.
Если есть открытые `PR` деплоится `Review App`.

Основные конфигурационые файлы:
```
heroku.yml
Dockerfile
.travis.yml
```

**Тесты**    
`Unit` тестов вышло совсем немного, так как по большей части внутри методов    
класса `Git` раположена достаточно простая логика обработки консольного вывода    
команды `git`. Наверное было бы правильно написать еще парочку `unit`,     
в которых бы отличался формат входных данных, но я не стал этого делать.
Запуск тестов:
`npm run test` - запускает интеграционные тесты для модуля `Git` и `unit` тесты    
`npm run hermione` - запускает интеграционные тесты приложения в `Chrome` и `FireFox`
```
test/
├── integrations
│   ├── hermione
│   │   └── testUI.js // Тесты WebdriverIO
│   └── testGit.js  // Тесты функционалности модуля Git
                    // в работе используют вызовы git в консоли.
└── unit
    └── testGit.js // Тесты внутренней логики парсеров.
```
