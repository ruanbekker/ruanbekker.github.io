---
layout: post
title: "Customize VIM Editor with a Brand New Look"
date: 2022-05-11 17:10:16 -0400
comments: true
categories: ["vim", "linux"] 
---

In this tutorial we will customize the vim editor, by adding the molokai color scheme, change a couple of basic settings (more suited for my preference - not too much) and add a couple of plugins that will change the look to something like this:

![image](https://user-images.githubusercontent.com/567298/161967893-c19e460a-a8f6-4841-b3cd-de8419522790.png)

## About Vim

**[vim](https://www.vim.org/)** has always been my favorite linux text editor, which is super powerful and highly customizable

## Install Vim

Update indexes:

```bash
sudo apt update
```

Install vim:

```bash
sudo apt install vim -y
```

## Color Scheme

To find all existing vim color schemes installed:

```bash
find /usr/share/vim/vim*/colors/ -type f -name "*.vim"
```

The output on mine shows:

```
/usr/share/vim/vim81/colors/desert.vim
/usr/share/vim/vim81/colors/default.vim
/usr/share/vim/vim81/colors/murphy.vim
...
```

I will be opting for [molokai](https://github.com/tomasr/molokai), so first create the directory where we will download our color scheme:

```bash
mkdir -p ~/.vim/colors
```

Then download the color scheme:

```
curl -o ~/.vim/colors/molokai.vim https://raw.githubusercontent.com/tomasr/molokai/master/colors/molokai.vim
```

By default our color scheme will look like this when we create `foo.py`:

![image](https://user-images.githubusercontent.com/567298/161961784-ff536963-baca-492b-989b-5d61bc4dfa71.png)

When we hit the "esc" button, and enter `:colorscheme molokai` we can change the colorscheme to molokai, and then we should have the following:

![image](https://user-images.githubusercontent.com/567298/161962129-434f42ff-c894-4388-9d2e-5dbf1c80e1f5.png)

To persist these changes, open up `~/.vimrc` and paste the following as a starter:

```
colorscheme molokai
syntax on
```

Now when we open up `foo.py` we will see that it defaults to the `molokai` color scheme. 

## Vim Configuration

Everyone has their own personal preference on vim configs, but I like to keep mine basic, and this is the content of my `~/.vimrc`:

```bash
colorscheme molokai
syntax on
set mouse-=a

filetype on
filetype indent plugin on
set noexpandtab " tabs ftw
set smarttab " tab respects 'tabstop', 'shiftwidth', and 'softtabstop'
set tabstop=4 " the visible width of tabs
set softtabstop=4 " edit as if the tabs are 4 characters wide
set shiftwidth=4 " number of spaces to use for indent and unindent
set shiftround " round indent to a multiple of 'shiftwidth'

autocmd FileType yml setlocal ts=2 sts=2 sw=2 expandtab
autocmd FileType yaml setlocal ts=2 sts=2 sw=2 expandtab
```

## Plugins

The `~/.vimrc`:

```
"" https://github.com/VundleVim/Vundle.vim
set nocompatible
filetype off
" set the runtime path to include Vundle and initialize
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
" alternatively, pass a path where Vundle should install plugins
"call vundle#begin('~/some/path/here')

" let Vundle manage Vundle, required
Plugin 'VundleVim/Vundle.vim'

" The following are examples of different formats supported.
" Keep Plugin commands between vundle#begin/end.
" plugin on GitHub repo
Plugin 'tpope/vim-fugitive'
" plugin from http://vim-scripts.org/vim/scripts.html
" Plugin 'L9'
" Git plugin not hosted on GitHub
Plugin 'git://git.wincent.com/command-t.git'
" git repos on your local machine (i.e. when working on your own plugin)
" Plugin 'file:///home/gmarik/path/to/plugin'
" The sparkup vim script is in a subdirectory of this repo called vim.
" Pass the path to set the runtimepath properly.
Plugin 'rstacruz/sparkup', {'rtp': 'vim/'}
" Install L9 and avoid a Naming conflict if you've already installed a
" different version somewhere else.
" Plugin 'ascenator/L9', {'name': 'newL9'}

" All of your Plugins must be added before the following line
call vundle#end()            " required
filetype plugin indent on    " required
" To ignore plugin indent changes, instead use:
"filetype plugin on
"
" Brief help
" :PluginList       - lists configured plugins
" :PluginInstall    - installs plugins; append `!` to update or just :PluginUpdate
" :PluginSearch foo - searches for foo; append `!` to refresh local cache
" :PluginClean      - confirms removal of unused plugins; append `!` to auto-approve removal
"
" see :h vundle for more details or wiki for FAQ
" Put your non-Plugin stuff after this line

" colorscheme duo-mini
" sets color themes
colorscheme molokai
syntax on

" sets the filename at the bottom
set laststatus=2
" https://github.com/itchyny/lightline.vim
Plugin 'itchyny/lightline.vim'

" https://github.com/Shougo/neobundle.vim
" Note: Skip initialization for vim-tiny or vim-small.
if 0 | endif

if &compatible
  set nocompatible               " Be iMproved
endif

" Required:
set runtimepath+=~/.vim/bundle/neobundle.vim/

" Required:
call neobundle#begin(expand('~/.vim/bundle/'))

" Let NeoBundle manage NeoBundle
" Required:
NeoBundleFetch 'Shougo/neobundle.vim'

" My Bundles here:
" Refer to |:NeoBundle-examples|.
" Note: You don't set neobundle setting in .gvimrc!
NeoBundle 'itchyny/lightline.vim'
call neobundle#end()

" Required:
filetype plugin indent on

" If there are uninstalled bundles found on startup,
" this will conveniently prompt you to install them.
NeoBundleCheck

" https://github.com/junegunn/vim-plug
" Specify a directory for plugins
" - For Neovim: stdpath('data') . '/plugged'
" - Avoid using standard Vim directory names like 'plugin'
call plug#begin('~/.vim/plugged')

" Make sure you use single quotes

" Shorthand notation; fetches https://github.com/junegunn/vim-easy-align
Plug 'junegunn/vim-easy-align'

" Any valid git URL is allowed
Plug 'https://github.com/junegunn/vim-github-dashboard.git'

" Multiple Plug commands can be written in a single line using | separators
"Plug 'SirVer/ultisnips' | Plug 'honza/vim-snippets'

" On-demand loading
Plug 'scrooloose/nerdtree', { 'on':  'NERDTreeToggle' }
Plug 'tpope/vim-fireplace', { 'for': 'clojure' }

" Using a non-master branch
Plug 'rdnetto/YCM-Generator', { 'branch': 'stable' }

" Using a tagged release; wildcard allowed (requires git 1.9.2 or above)
Plug 'fatih/vim-go', { 'tag': '*' }

" Plugin options
Plug 'nsf/gocode', { 'tag': 'v.20150303', 'rtp': 'vim' }

" Plugin outside ~/.vim/plugged with post-update hook
Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }

" Unmanaged plugin (manually installed and updated)
Plug '~/my-prototype-plugin'

Plug 'itchyny/lightline.vim'

" Initialize plugin system
call plug#end()

" sets the filename as the title up top
" set title
" let g:airline#extensions#tabline#enabled = 1

set noexpandtab " tabs ftw
set smarttab " tab respects 'tabstop', 'shiftwidth', and 'softtabstop'
set tabstop=4 " the visible width of tabs
set softtabstop=4 " edit as if the tabs are 4 characters wide
set shiftwidth=4 " number of spaces to use for indent and unindent
set shiftround " round indent to a multiple of 'shiftwidth'
autocmd FileType yml setlocal ts=2 sts=2 sw=2 expandtab
autocmd FileType yaml setlocal ts=2 sts=2 sw=2 expandtab
```

Install the dependencies:

```
git clone https://github.com/Shougo/neobundle.vim ~/.vim/bundle/neobundle.vim
curl -fLo ~/.vim/autoload/plug.vim --create-dirs https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim
```

Install the plugins:

```
vim +NeoBundleInstall +qall
vim +PluginInstall +qall
```

Your vim editor should look like this:

![image](https://user-images.githubusercontent.com/567298/161967893-c19e460a-a8f6-4841-b3cd-de8419522790.png)

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

