class ContextMenu {
    constructor() {
        this.data = null;
        this.coord = null;
        this.contextMenu = null;

        this.menuVisible = false;

        this.root = document.querySelector('.root');

        this.showMenu = this.root.addEventListener('contextmenu', this.contextMenuHandles.bind(this), false);
        this.hideMenu = window.addEventListener('click', this.hideMenu.bind(this), false);
    }

    async contextMenuHandles(e) {
        e.preventDefault();

        try {
          this.data = await this.getData();
        } catch(error) {
            console.error('Error: ' + error);
            return false;
        }

        this.coord = {
            left: e.pageX,
            top: e.pageY
        }

        if(this.menuVible) {
            this.removeNode();
        }

        this.menuBuilder(this.data);
    }

    /**
     * get data with XMLHttpRequest
     * return promise
     */
    getData() {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', './data.json', true);

            xhr.onload = function() {
                if(this.status === 200) {
                    resolve(JSON.parse(this.responseText));
                } else {
                    reject('Something went wrong! Status: ' + this.status);
                }
            }

            xhr.send();
        });
    }

    /**
     *
     * @param {object} data
     * receive object with data and render context menu on the page
     */
    menuBuilder(data) {
        this.contextMenu = document.createElement('div');
        this.contextMenu.classList.add('context-menu');

        //add list of options to context menu
        const ul = this.generateList(data)
        ul.classList.add('options');
        this.contextMenu.appendChild(ul);

        //add arrows to context menu and set into page
        const up = document.createElement('div'),
            down = document.createElement('div');

        up.classList.add('arrow', 'up');
        down.classList.add('arrow', 'down');

        up.style.visibility = 'hidden';

        up.innerHTML = `&#9650;`; // ▲
        down.innerHTML = `&#9660;`; //▼

        up.addEventListener('click', this.scrollHandler.bind(this));
        down.addEventListener('click', this.scrollHandler.bind(this));

        this.contextMenu.appendChild(up);
        this.contextMenu.appendChild(down);
        this.root.appendChild(this.contextMenu);

        this.setPosition(this.contextMenu);

        this.toggleMenu('show');

        this.hideOverFlow(ul);

        const coords = this.getCoords(this.contextMenu);
        this.fitExpand(coords);
    }

    /**
     *
     * @param {object} data
     * receive object with data and generate ul list with sublists
     */
    generateList(data) {
        const ul = document.createElement('ul');
        for(let key in data){
            const li = document.createElement('li');
            li.innerText = data[key].title;
            ul.appendChild(li);

            if(data[key].disabled) {
                li.classList.add('disabled-item');
            } else {
                li.addEventListener('mouseenter', this.enterElement.bind(this));
                li.addEventListener('mouseleave', this.leaveElement.bind(this));
                if(data[key].subList) {
                    li.innerText += " >";
                    li.classList.add('parent');
                    const sublist = this.generateList(data[key].subList);
                    sublist.classList.add('sublist');
                    li.appendChild(sublist);
                }
            }
        }

        return ul;
    }

    /**
     *
     * @param {event} e
     * select elements under cursor and open sublists
     */
    enterElement(e) {
        const elem = e.target;

        elem.classList.add('select');

        if(elem.classList.contains('parent')) {
            const sublist = elem.querySelector('.sublist');

            sublist.style.display = 'block';

            const liHeight = sublist.querySelector('li').offsetHeight,
                coords = this.getCoords(sublist);

            //decide which side choose for sublist
            if(coords.right + 200 > document.documentElement.clientWidth) {
                sublist.style.right = sublist.offsetWidth + 'px';
            } else {
                sublist.style.left = sublist.offsetWidth + 'px';
            }

            if(coords.bottom > document.documentElement.clientHeight) {
                sublist.style.top = -sublist.offsetHeight + liHeight + 'px';
            }
        }

        elem.removeEventListener('mouseleave', this.leaveElement);
    }

    leaveElement(e) {
        const elem = e.target;

        elem.classList.remove('select');

        if(elem.classList.contains('parent')) {
            const sublist = elem.querySelector('.sublist');

            sublist.style.display = 'none';
            sublist.style.right = 0;
        }

        elem.removeEventListener('mouseenter', this.enterElement);
    }

    /**
     *
     * @param {event} e
     * scroll up/down context menu items
     */
    scrollHandler(e) {
        const elem = document.querySelector('.options'),
            liHeight = elem.firstElementChild.offsetHeight,
            style = window.getComputedStyle(elem),
            top = style.getPropertyValue('top'),
            listCoords = this.getCoords(elem),
            menuCoords = this.getCoords(this.contextMenu);

        if(e.target.classList.contains('down')) {

            if(listCoords.bottom > menuCoords.bottom) {
                elem.style.top = parseInt(top, 10) - liHeight + 'px';
                document.querySelector('.arrow.up').style.visibility = 'visible';
            }

            if(listCoords.bottom <= menuCoords.bottom + liHeight) {
                document.querySelector('.arrow.down').style.visibility = 'hidden';
            }

        } else if(e.target.classList.contains('up')) {

            if(listCoords.top < menuCoords.top) {
                elem.style.top = parseInt(top, 10) + liHeight + 'px';
                document.querySelector('.arrow.down').style.visibility = 'visible';
            }

            if(listCoords.top === menuCoords.top) {
                document.querySelector('.arrow.up').style.visibility = 'hidden';
            }
        }

        this.hideOverFlow(elem);
    }

    removeNode() {
        this.toggleMenu('hide');
        this.root.removeChild(this.contextMenu);
    }

    toggleMenu(command) {
        this.contextMenu.style.display = command === "show" ? "block" : "none";
        this.menuVible = !this.menuVible;
    }

    hideMenu(e) {
        const elem = document.elementFromPoint(e.clientX, e.clientY).closest('.context-menu');

        if(this.menuVible && !Boolean(elem)) {
            this.removeNode();
        }
    }

    /**
     *
     * @param {HTMLUlElement} elem
     * kind of overflow: hidden; for context menu. Becouse with that css property it work incorrectly
     */
    hideOverFlow(elem) {
        for(let i = 0; i < elem.children.length; i++) {
            elem.children[i].style.visibility = 'visible';

            const liCoords = this.getCoords(elem.children[i]);

            if(liCoords.bottom > this.contextMenu.offsetTop + this.contextMenu.offsetHeight || liCoords.top < this.contextMenu.offsetTop) {
                elem.children[i].style.visibility = 'hidden';
            }
        }
    }

    fitExpand(coords) {
        if(coords.right > document.documentElement.clientWidth) {
            this.contextMenu.style.left = this.coord.left - this.contextMenu.offsetWidth + 'px';
        }

        if(coords.bottom > document.documentElement.clientHeight) {
            this.contextMenu.style.top = this.coord.top - this.contextMenu.offsetHeight + 'px';
        }
    }

    /**
     *
     * @param {HTMLElement} menu
     * set position for context menu
     */
    setPosition(menu) {
        menu.style.left = this.coord.left + 'px';
        menu.style.top = this.coord.top + 'px';
    }

    /**
     *
     * @param {HTMLElement} elem
     * return object with element coordinats
     */
    getCoords(elem) {
        let box = elem.getBoundingClientRect();

        return {
          top: box.top + pageYOffset,
          left: box.left + pageXOffset,
          bottom: box.bottom + pageYOffset,
          right: box.right + pageXOffset
        };
    }
}

const contextMenu = new ContextMenu();