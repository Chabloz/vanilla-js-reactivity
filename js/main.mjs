import {ref, watch, reactive, computed} from './reactivity.mjs';

const x = ref(2);

const y = computed(() => x.value * 2);

const z = computed(() => y.value * 2);

watch(y, v => console.log(v), false);
watch(z, v => console.log(v), false);

x.value = 3;