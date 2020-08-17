<template>
	<div>
		<q-bar class="bg-black text-weight-light text-white q-electron-drag q-pr-none">
			<div :class="{'col flex flex-center': isDarwin}">
				<div class="row items-center">
					<q-btn v-if="!isDarwin" flat dense round icon="menu" @click="toggleSidebar" />
					<div class="col-auto">
						<img class="flex flex-center" src="../assets/FAIR4Health-logo.png" width="80px">
					</div>
					<div class="col text-weight-bold text-size-xl">{{ $t('COMMON.APP_NAME') }}</div>
				</div>
			</div>
			<template v-if="!isDarwin">
				<q-space />
				<div class="q-mx-none q-px-none">
					<q-btn flat square icon="remove" class="title-bar-btn" @click="minimizeApp" />
					<q-btn flat :icon="isMaximized ? 'mdi-window-restore' : 'mdi-crop-square'" class="title-bar-btn" @click="toggleFullScreen" />
					<q-btn flat icon="close" class="title-bar-btn btn-close" @click="closeApp" />
				</div>
			</template>
		</q-bar>
		<div class="bg-grey-10 q-pa-sm q-pl-md row items-center">
			<div class="cursor-pointer non-selectable">
				{{ $tc('MENU.FILE') }}
				<q-menu>
					<q-list dense>
						<q-item clickable v-close-popup @click="closeApp">
							<q-item-section>{{ $tc('MENU.EXIT') }}</q-item-section>
						</q-item>
					</q-list>
				</q-menu>
			</div>
			<div class="q-ml-md cursor-pointer non-selectable">
				{{ $tc('MENU.VIEW') }}
				<q-menu auto-close>
					<q-list dense style="min-width: 150px">
						<q-item clickable @click="toggleFullScreen">
							<q-item-section>{{ $tc('MENU.TOGGLE_FULL_SCREEN') }}</q-item-section>
						</q-item>
					</q-list>
				</q-menu>
			</div>
			<div class="q-ml-md cursor-pointer non-selectable">
				{{ $tc('MENU.TOOL') }}
				<q-menu auto-close>
					<q-list dense style="min-width: 150px">
						<q-item clickable @click="toggleDevTools">
							<q-item-section>{{ $tc('MENU.TOGGLE_DEVELOPER_TOOLS') }}</q-item-section>
						</q-item>
					</q-list>
				</q-menu>
			</div>
			<div class="q-ml-md cursor-pointer non-selectable">
				{{ $tc('MENU.HELP') }}
				<q-menu auto-close>
					<q-list dense>
						<q-item clickable @click="openExternal(projectHomePage)">
							<q-item-section>{{ $tc('MENU.HELP') }}</q-item-section>
						</q-item>
					</q-list>
				</q-menu>
			</div>
			<q-space />
			<q-btn-dropdown dense
			                flat
			                :label="$i18n.locale"
			                :menu-offset="[0, 4]"
			                size="9px"
			                icon="language"
			>
				<q-list dense>
					<q-item
					        clickable
					        v-close-popup
					        v-for="lang in langs"
					        :key="lang"
					        class="flex flex-center"
					        @click="$i18n.locale = lang"
					>
						<span class="text-size-xs text-uppercase">{{ lang }}</span>
					</q-item>
				</q-list>
			</q-btn-dropdown>
		</div>
	</div>
</template>

<script lang="ts">
    import { Component, Vue, Watch } from 'vue-property-decorator'
    import {remote, shell} from 'electron'
    import {environment} from '@/common/environment';
    import { VuexStoreUtil as types } from '@/common/utils/vuex-store-util'

    @Component
    export default class TitleBar extends Vue {
        private currentWindow = remote.getCurrentWindow()
        private isMaximized = this.currentWindow.isMaximized()
        private langs = environment.langs

        get projectHomePage () { return window.process.env.ELECTRON_WEBPACK_APP_F4H_HOMEPAGE }
        get isDarwin (): boolean { return remote.process.platform === 'darwin' }

        get drawerOpen (): boolean { return this.$store.getters[types.DRAWER_OPEN] }
        set drawerOpen (value) { this.$store.commit(types.SET_DRAWER_OPEN, value) }

        get drawerMiniState (): boolean { return this.$store.getters[types.DRAWER_MINI_STATE] }
        set drawerMiniState (value) { this.$store.commit(types.SET_DRAWER_MINI_STATE, value) }

        @Watch('$q.screen.height')
        onHeightChange () {
            this.isMaximized = this.currentWindow.isMaximized()
        }

        toggleFullScreen () {
            if (this.currentWindow.isMaximized()) this.currentWindow.unmaximize()
            else this.currentWindow.maximize()
        }

        toggleSidebar () {
            if (this.$q.screen.lt.lg || !this.drawerOpen) this.drawerOpen = !this.drawerOpen
            else this.drawerMiniState = !this.drawerMiniState
        }

        minimizeApp () { this.currentWindow.minimize() }
        closeApp () { this.currentWindow.destroy() }
        toggleDevTools () { remote.getCurrentWebContents().toggleDevTools() }
        openExternal (url: string) { shell.openExternal(url) }
    }

</script>

<style scoped>

</style>
