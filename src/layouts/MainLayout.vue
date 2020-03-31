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
			<q-list class="menu-list">
				<q-item to="/" exact active-class="text-primary bg-blue-grey-1 text-weight-bold">
					<q-item-section avatar>
						<q-icon name="home" />
					</q-item-section>
					<q-item-section>
						<q-item-label>Home</q-item-label>
					</q-item-section>
					<q-tooltip v-if="isCollapsed" anchor="center right" self="center left" :offset="[5, 10]"
					           content-class="bg-grey-4 text-grey-9" transition-show="scale" transition-hide="scale">
						Home
					</q-tooltip>
				</q-item>
				<q-item to="/deidentification" exact active-class="text-primary bg-blue-grey-1 text-weight-bold">
					<q-item-section avatar>
						<q-icon name="security" />
					</q-item-section>
					<q-item-section>
						<q-item-label>De-identification</q-item-label>
					</q-item-section>
					<q-tooltip v-if="isCollapsed" anchor="center right" self="center left" :offset="[5, 10]"
					           content-class="bg-grey-4 text-grey-9" transition-show="scale" transition-hide="scale">
						De-identification
					</q-tooltip>
				</q-item>
				<q-item v-if="$route.name==='deidentification'" animation>
					<q-stepper flat vertical :contracted="isCollapsed" v-model="currentStep"
					           ref="stepper" alternative-labels color="primary" class="bg-grey-3"
					           :style="isCollapsed ? 'padding: 0; width: 70px' : ''">
						<q-step v-for="step in steps" :key="step.stepId"
						        :class="{'step-item cursor-pointer': currentStep > step.stepId}"
						        :name="step.stepId"
						        :title="step.title"
						        :icon="step.icon"
						        :done-icon="step.icon"
						        :done="currentStep > step.stepId"
						        active-color="grey-7"
						        done-color="primary"
						/>
					</q-stepper>
				</q-item>
				<q-separator />
				<q-item to="/about" exact active-class="text-primary bg-blue-grey-1 text-weight-bold">
					<q-item-section avatar>
						<q-icon name="info" />
					</q-item-section>
					<q-item-section>
						<q-item-label>About</q-item-label>
					</q-item-section>
					<q-tooltip v-if="isCollapsed" anchor="center right" self="center left" :offset="[5, 10]"
					           content-class="bg-grey-4 text-grey-9" transition-show="scale" transition-hide="scale">
						About
					</q-tooltip>
				</q-item>
			</q-list>
			<q-list v-if="($q.screen.gt.md && !drawerMiniState) || $q.screen.xs" padding class="text-grey-8 fixed-bottom">
				<q-separator />
				<q-item>
					<q-item-section>
			            <span class="text-weight-bold flex flex-center text-caption">
			              <span>Powered by </span>
			              <img src="https://www.srdc.com.tr/wp-content/uploads/2014/12/srdc-wp.png" class="q-ml-sm" width="120px">
			            </span>
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

@Component({
    components: { TitleBar }
})
export default class MainLayout extends Vue {
    private steps: StepItem[] = [
        { title: 'Metadata Analyzer', icon: 'fas fa-database', stepId: 1 },
        { title: 'Configuration Manager', icon: 'fas fa-sliders-h', stepId: 2 },
        { title: 'De-identifier', icon: 'fas fa-user-secret', stepId: 3 },
        { title: 'Evaluater', icon: 'fas fa-balance-scale', stepId: 4 }
    ];

    get drawerOpen (): boolean { return this.$store.getters.drawerOpen }
    set drawerOpen (value) { this.$store.commit('setDrawerOpen', value) }

    get drawerMiniState (): boolean { return this.$store.getters.drawerMiniState }
    set drawerMiniState (value) { this.$store.commit('setDrawerMiniState', value) }

    get currentStep (): number { return this.$store.getters.privacyStep }
    get isCollapsed () { return (this.$q.screen.gt.xs && (this.$q.screen.lt.lg || this.drawerMiniState)) }

}
</script>

<style lang="stylus">
	.title-bar-btn
		border-radius 0 0
	.btn-close:hover
		background red
	.main-page
		margin-left auto
		margin-right auto
	.menu-list .q-item
		border-radius 0 32px 32px 0
	.step-item:hover
		background #e5e5e5
	.fill-window
		height calc(100vh - 68.44px)
</style>
