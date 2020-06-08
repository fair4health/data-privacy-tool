<template>
	<q-layout view="hHh Lpr lFf" class="bg-grey-3">
		<q-header elevated>
			<TitleBar />
		</q-header>

		<q-drawer
			v-model="drawerOpen"
			show-if-above
			bordered
			content-class="bg-grey-2"
			:width="240"
			:mini-width="75"
			:breakpoint="500"
			:mini="$q.screen.lt.lg || drawerMiniState"
		>
			<q-list class="menu-list text-grey-8">
				<q-item to="/" exact active-class="text-primary bg-grey-3 text-weight-bold">
					<q-item-section avatar>
						<q-icon name="home" />
						<span v-show="$q.screen.lt.lg || drawerMiniState" style="font-size: 10px">{{ $t('MENU.HOME') }}</span>
					</q-item-section>
					<q-item-section>
						<q-item-label>{{ $t('MENU.HOME') }}</q-item-label>
					</q-item-section>
				</q-item>
				<q-item to="/deidentification" exact active-class="text-primary bg-grey-3 text-weight-bold">
					<q-item-section avatar class="items-center">
						<q-icon name="security" />
						<span v-show="$q.screen.lt.lg || drawerMiniState" style="font-size: 10px">{{ $t('MENU.DEIDENTIFY') }}</span>
					</q-item-section>
					<q-item-section>
						<q-item-label>{{ $t('MENU.DEIDENTIFICATION') }}</q-item-label>
					</q-item-section>
				</q-item>
				<q-item v-if="$route.name==='deidentification'" animation>
					<q-stepper flat vertical :contracted="isCollapsed" v-model="currentStep"
					           ref="stepper" alternative-labels color="primary" class="bg-grey-3 no-padding"
					           :style="isCollapsed ? 'width: 70px' : ''">
						<q-step v-for="step in steps" :key="step.stepId"
						        :class="{'step-item cursor-pointer': currentStep > step.stepId}"
						        @click="changeCurrentStep(step.stepId)"
						        :name="step.stepId"
						        :title="$t(step.title)"
						        :icon="step.icon"
						        :done-icon="step.icon"
						        :done="currentStep > step.stepId"
						        active-color="grey-8"
						        done-color="primary"
						/>
					</q-stepper>
				</q-item>
				<q-separator />
				<q-item to="/about" exact active-class="text-primary bg-grey-3">
					<q-item-section avatar class="items-center">
						<q-icon name="info" />
						<span v-show="$q.screen.lt.lg || drawerMiniState" style="font-size: 10px">{{ $t('MENU.ABOUT') }}</span>
					</q-item-section>
					<q-item-section>
						<q-item-label>{{ $t('MENU.ABOUT') }}</q-item-label>
					</q-item-section>
				</q-item>
			</q-list>
			<q-list class="fixed-bottom">
				<q-separator />
				<q-item clickable @click="openExternal(projectHomePage)">
					<q-item-section avatar>
						<q-avatar size="sm">
							<img src="../assets/github-logo.png" />
						</q-avatar>
					</q-item-section>
					<q-item-section class="text-grey-7">
						<span>{{ $t('MENU.VIEW_ON') }} <span class="text-weight-bold">GitHub</span></span>
					</q-item-section>
				</q-item>
			</q-list>
		</q-drawer>

		<!--Router view in page container-->
		<q-page-container class="main-page">
			<q-page class="full-height">
				<div class="fill-window" style="overflow-y: auto">
					<router-view />
				</div>
			</q-page>
		</q-page-container>
	</q-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TitleBar from '@/layouts/TitleBar.vue';
import {shell} from 'electron';

@Component({
    components: { TitleBar }
})
export default class MainLayout extends Vue {
    private steps: StepItem[] = [
        { title: 'MENU.METADATA_ANALYZER', icon: 'fas fa-database', stepId: 1 },
        { title: 'MENU.CONFIGURATION_MANAGER', icon: 'fas fa-sliders-h', stepId: 2 },
        { title: 'MENU.DEIDENTIFIER', icon: 'fas fa-user-secret', stepId: 3 }
    ];

    get drawerOpen (): boolean { return this.$store.getters.drawerOpen }
    set drawerOpen (value) { this.$store.commit('setDrawerOpen', value) }

    get drawerMiniState (): boolean { return this.$store.getters.drawerMiniState }
    set drawerMiniState (value) { this.$store.commit('setDrawerMiniState', value) }

    get currentStep (): number { return this.$store.getters.privacyStep }
    set currentStep (value) { this.$store.commit('setStep', value) }

    get isCollapsed () { return (this.$q.screen.gt.xs && (this.$q.screen.lt.lg || this.drawerMiniState)) }
    get projectHomePage () { return window.process.env.ELECTRON_WEBPACK_APP_F4H_HOMEPAGE }

    changeCurrentStep (stepId: number) {
        if (this.currentStep > stepId) {
            this.currentStep = stepId;
        }
    }

    openExternal (url: string) {
        shell.openExternal(url);
    }

}
</script>

<style lang="stylus">
	.title-bar-btn
		border-radius 0 0
	.btn-close:hover
		background red
	.main-page
		/*max-width 1400px*/
		margin-left auto
		margin-right auto
	.menu-list .q-item.q-router-link--exact-active
		border-left solid 4px #B26F95
	.menu-list .q-item
		border-radius 0 32px 32px 0
	.step-item:hover
		background #e5e5e5
	.fill-window
		height calc(100vh - 68.44px)
</style>
