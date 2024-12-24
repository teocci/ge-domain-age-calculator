export default class Loader {
    constructor($loader) {
        this.$loader = $loader
    }

    show() {
        this.$loader.style.display = 'block'
    }

    hide() {
        this.$loader.style.display = 'none'
    }
}