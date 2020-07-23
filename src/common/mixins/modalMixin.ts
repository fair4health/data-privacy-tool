import { Vue, Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'

@Component
export default class ModalMixin extends Vue {

    public show () {
        (this.$refs.dialog as QDialog).show()
    }

    public hide () {
        (this.$refs.dialog as QDialog).hide()
    }

    public onDialogHide () {
        this.$emit('hide')
    }

    public onCloseClick () {
        this.hide()
    }

}
