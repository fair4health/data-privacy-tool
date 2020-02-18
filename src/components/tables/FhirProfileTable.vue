<template>
	<div class="splitter-slot">
		<q-item-label class="text-weight-bold q-mt-lg q-mb-lg">
			<span class="text-info"><q-icon name="fas fa-info" size="xs" class="q-mr-xs" /> Select which type of resources will be included in de-identified data. </span>
		</q-item-label>

		<q-input v-model="searchString" outlined dense type="search" placeholder="Resource Type" color="primary" bg-color="white" @input="searchResources()">
			<template v-slot:append>
				<q-icon name="search" />
			</template>
		</q-input>

		<q-expansion-item v-for="key in currentResources"
						  class="shadow-1 overflow-hidden q-my-sm"
						  style="border-radius: 20px"
						  :label="key"
						  header-class="bg-primary text-white"
						  expand-icon-toggle
						  :expand-icon-class="[resources[key] && resources[key].length ? 'text-white' : 'text-primary cursor-inherit']"
		>
			<template v-slot:header>
				<q-item-section avatar>
					<q-checkbox v-model="selectedResources" :val="key" color="secondary" dark @input="resourceSelected(key)" />
				</q-item-section>
				<q-item-section>
					{{key}}
				</q-item-section>
			</template>

			<q-card>
				<template v-for="profile in resources[key]">
					<q-item>
						<q-item-section avatar class="q-ml-sm">
							<q-checkbox size="md" v-model="selectedProfiles" :val="profile.id" color="secondary" />
						</q-item-section>
						<q-item-section>
							<q-item-label>{{profile.title}}</q-item-label>
						</q-item-section>
						<q-item-section side>
							<q-btn flat round
							       icon="fas fa-eye"
							       color="secondary"
							       @click="getProfileInfo(profile)"
							/>
						</q-item-section>
					</q-item>
					<q-separator />
				</template>
			</q-card>

		</q-expansion-item>
	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class FhirProfileTable extends Vue {
    private searchString: string = '';
    private resources = {};
    private currentResources: string[] = [];

    get fhirResourceList (): string[] { return this.$store.getters['fhir/resourceList'] }
    get selectedResources (): string[] { return this.$store.getters['fhir/selectedResources'] }
    set selectedResources (value) { this.$store.commit('fhir/setSelectedResources', value) }

    get fhirProfileList (): Array<{id: string, title: string}> { return this.$store.getters['fhir/profileList'].map(r => JSON.parse(JSON.stringify(r))) }
    get selectedProfiles (): string[] { return this.$store.getters['fhir/selectedProfiles'].map(r => JSON.parse(JSON.stringify(r))) }
    set selectedProfiles (value) { this.$store.commit('fhir/setSelectedProfiles', value) }

    created () {
        this.$store.dispatch('fhir/getResources').then(res => {
            this.currentResources = JSON.parse(JSON.stringify(this.fhirResourceList));
            this.selectedResources = this.selectedResources;
            for (const resource of this.fhirResourceList) {
                this.$store.dispatch('fhir/getProfilesByRes', resource).then(pro => {
                    this.resources[JSON.parse(JSON.stringify(resource))] = JSON.parse(JSON.stringify(this.fhirProfileList));
                    this.selectedProfiles = this.selectedProfiles;
                    this.$forceUpdate();
                });
            }
        });
    }

    resourceSelected (resource) {
        const resourceIndex = this.selectedResources.indexOf(resource);
        for (const profile of this.resources[resource]) {
            const profileIndex = this.selectedProfiles.indexOf(profile.id);
            if (resourceIndex !== -1) { // all profiles should be selected
                if (profileIndex === -1) {
                    this.selectedProfiles.push(profile.id);
                }
            } else { // all profiles should be removed
                if (profileIndex !== -1) {
                    this.selectedProfiles.splice(profileIndex, 1);
                }
            }
          }
        this.selectedProfiles = this.selectedProfiles;
    }

    getProfileInfo (profile: any) {
        // TODO provide info about corresponding profile
        console.log(profile);
    }

    searchResources () {
        this.currentResources = this.fhirResourceList.filter(resource => resource.toUpperCase().startsWith(this.searchString.toUpperCase()));
    }

}
</script>
