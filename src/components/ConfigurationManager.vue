<template>
    <div>
        <q-toolbar class="bg-grey-4">
            <q-toolbar-title class="text-grey-8">
                Configuration Manager
            </q-toolbar-title>
            <q-space />
            <q-btn flat round
                   icon="fas fa-arrow-alt-circle-left"
                   color="secondary"
                   @click="$store.commit('decrementStep')"
            />
            <q-btn flat round
                   icon="fas fa-arrow-alt-circle-right"
                   color="primary"
                   @click="$store.commit('incrementStep')"
            />
        </q-toolbar>
    </div>
</template>


<script>
    export default {
        name: 'ConfigurationManager'
    }
</script>

<style scoped>

</style>
