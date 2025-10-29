<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { ChevronsUpDown, Search, Home, User2, DatabaseBackupIcon } from 'lucide-vue-next';
import { useMagicKeys } from '@vueuse/core';

const commandId = ref<string>('command_palette');

const { meta, k } = useMagicKeys();

function toggleCommandPalette() {
	const dialogElement = document.getElementById(commandId.value) as HTMLDialogElement | null;
	if(dialogElement) {
		if (dialogElement.open) {
			dialogElement.close();
		} else {
			dialogElement.showModal();
		}
	}
}

watchEffect(() => {
	if (meta?.value && k?.value) {
		toggleCommandPalette();
	}	
});

const router = useRouter();

async function onCreate() {

	const response = await fetch('/api/v1/user');
	
	if(!response.ok) {
		router.push('/auth/login');
	}
}

onCreate();

</script>

<template>
  <div class="flex h-screen">
    
    <aside class="hidden md:flex md:flex-col md:w-64 h-full border-r border-base-200">
      
      <div class="px-4 py-4 border-b border-base-200 flex flex-col gap-4">
		<div class="flex gap-4 justify-between items-center p-0">
			<a href="/" class="shrink-0 ">
				<img src="/brand/vector.svg" alt="Kitledger" class="h-8 w-auto" />
			</a>
			<legend class="text-sm font-bold self-center line-clamp-2">Entropy Technologies, SPA</legend>
	  	</div>
		<button class="btn btn-sm btn-wide flex justify-between" @click="toggleCommandPalette">
			<span class="flex gap-2">
				<Search class="h-4 w-4" />
				Search...
			</span>
			<span>
				<kbd class="kbd kbd-sm">⌘</kbd>
				<kbd class="kbd kbd-sm">K</kbd>
			</span>
		</button>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <nav>
			<ul class="menu w-full">
				<li>
					<a>
					<Home class="h-5 w-5" />
					Item 2
					</a>
				</li>
				<li>
					<a>
					<User2 class="h-5 w-5" />
					Item 1
					</a>
				</li>
				<li>
					<a>
					<DatabaseBackupIcon class="h-5 w-5" />
					Item 3
					</a>
				</li>
			</ul>
        </nav>
      </div>
      
      <div class="p-4 border-t border-base-200 flex flex-col gap-4">
		<div class="dropdown dropdown-top">
			<div tabindex="0" role="button" class="btn btn-sm btn-wide flex justify-between">
				Console
				<ChevronsUpDown class="h-4 w-4" />
			</div>
			<ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
				<li><a>Item 1</a></li>
				<li><a>Item 2</a></li>
			</ul>
		</div>
        <div class="dropdown dropdown-top">
			<div class="flex justify-start items-center gap-2 btn btn-ghost btn-circle" tabindex="0" role="button">
				<div class="avatar">
					<div class="w-10 rounded-full">
						<img
							alt="Tailwind CSS Navbar component"
							src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
					</div>
				</div>
				<div class="flex flex-col items-start">
					<span class="font-bold text-sm truncate">Alejandro Barrera Aponte</span>
					<span class="text-xs text-muted text-base-content/50">Administrator</span>
				</div>
			</div>
			<ul
				tabindex="-1"
				class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
				<li>
				<a class="justify-between">
					Profile
					<span class="badge">New</span>
				</a>
				</li>
				<li><a>Settings</a></li>
				<li><a>Logout</a></li>
			</ul>
		</div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col h-screen">
      
		<header class="md:hidden p-4 border-b border-base-200">
			<div class="flex justify-between items-center">
			<h1 class="text-xl font-bold">[Mobile Logo]</h1>
			<button class="p-2" aria-label="Open menu">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
			</button>
			</div>
		</header>
		
		<main class="flex-1 overflow-y-auto">
			<router-view />
		</main>
      
    </div>

	<dialog :id="commandId" class="modal">
		<div class="modal-box p-0">
			<div class="flex flex-col">
				<label class="input input-lg w-full border-0 rounded-none border-b border-base-200">
					<input type="search" class="grow" placeholder="Search"></input>
					<Search class="h-5 w-5 ml-2" />
				</label>
				<div>
					<ul class="menu p-4 overflow-y-auto h-64">
						<li><a>Command 1</a></li>
						<li><a>Command 2</a></li>
						<li><a>Command 3</a></li>
						<li><a>Command 4</a></li>
						<li><a>Command 5</a></li>
						<li><a>Command 6</a></li>
						<li><a>Command 7</a></li>
						<li><a>Command 8</a></li>
						<li><a>Command 9</a></li>
						<li><a>Command 10</a></li>
					</ul>
				</div>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button>close</button>
		</form>
	</dialog>
  </div>
</template>