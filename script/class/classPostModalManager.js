class PostModalManager {
  static async open(post) {
    const modalElement = document.querySelector('[x-ref="postModal"]');

    if (modalElement) {
      Alpine.store("postModalData").post = post;
    }

    const modal = document.querySelector("#post-modal");
    const modalContent = document.querySelector("#post-modal-content");
    // Render modal content
    modalContent.innerHTML = `
      <div class="flex flex-col gap-3 p-6 max-[500px]:p-4 ${
        post.post_image
          ? `w-[1232px] max-[1240px]:w-full`
          : "min-[500px]:w-[656px] mx-auto bg-primary-100"
      }">
        <div class="flex items-center justify-between ${
          post.post_image ? `hidden` : ""
        }">
          <h2 class="text-white">Post Details</h2>
          <svg class="cursor-pointer" @click="openCommentModal = false" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.6622 11.8364C12.7164 11.8906 12.7594 11.9549 12.7887 12.0257C12.8181 12.0965 12.8332 12.1724 12.8332 12.2491C12.8332 12.3257 12.8181 12.4016 12.7887 12.4724C12.7594 12.5432 12.7164 12.6075 12.6622 12.6617C12.608 12.7159 12.5437 12.7589 12.4729 12.7883C12.4021 12.8176 12.3262 12.8327 12.2495 12.8327C12.1729 12.8327 12.097 12.8176 12.0262 12.7883C11.9554 12.7589 11.8911 12.7159 11.8369 12.6617L6.99984 7.82399L2.16281 12.6617C2.05336 12.7712 1.90492 12.8327 1.75013 12.8327C1.59534 12.8327 1.44689 12.7712 1.33744 12.6617C1.22799 12.5523 1.1665 12.4038 1.1665 12.2491C1.1665 12.0943 1.22799 11.9458 1.33744 11.8364L6.1752 6.99935L1.33744 2.16233C1.22799 2.05288 1.1665 1.90443 1.1665 1.74964C1.1665 1.59485 1.22799 1.44641 1.33744 1.33696C1.44689 1.2275 1.59534 1.16602 1.75013 1.16602C1.90492 1.16602 2.05336 1.2275 2.16281 1.33696L6.99984 6.17471L11.8369 1.33696C11.9463 1.2275 12.0948 1.16602 12.2495 1.16602C12.4043 1.16602 12.5528 1.2275 12.6622 1.33696C12.7717 1.44641 12.8332 1.59485 12.8332 1.74964C12.8332 1.90443 12.7717 2.05288 12.6622 2.16233L7.82448 6.99935L12.6622 11.8364Z" fill="white"/>
          </svg>
        </div>
        <div class="flex items-start gap-3 max-[1100px]:flex-col">
          ${
            post.post_image
              ? `<div class="flex-1">
                   <img class="max-[500px]:hidden size-full" src="${post.post_image}" alt="Post image" class="object-cover">
                 </div>`
              : ""
          }
          <article class="flex-1 flex flex-col gap-3 w-full post bg-primary-100 rounded-lg shadow-sm max-[500px]:mb-[150px] ${
            post.post_image ? `min-[500px]:p-4` : ""
          }">
            <div class="flex items-center justify-between ${
              post.post_image ? `` : "hidden"
            }">
              <h2 class="text-white">Post Details</h2>
              <svg class="cursor-pointer" @click="openCommentModal = false" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.6622 11.8364C12.7164 11.8906 12.7594 11.9549 12.7887 12.0257C12.8181 12.0965 12.8332 12.1724 12.8332 12.2491C12.8332 12.3257 12.8181 12.4016 12.7887 12.4724C12.7594 12.5432 12.7164 12.6075 12.6622 12.6617C12.608 12.7159 12.5437 12.7589 12.4729 12.7883C12.4021 12.8176 12.3262 12.8327 12.2495 12.8327C12.1729 12.8327 12.097 12.8176 12.0262 12.7883C11.9554 12.7589 11.8911 12.7159 11.8369 12.6617L6.99984 7.82399L2.16281 12.6617C2.05336 12.7712 1.90492 12.8327 1.75013 12.8327C1.59534 12.8327 1.44689 12.7712 1.33744 12.6617C1.22799 12.5523 1.1665 12.4038 1.1665 12.2491C1.1665 12.0943 1.22799 11.9458 1.33744 11.8364L6.1752 6.99935L1.33744 2.16233C1.22799 2.05288 1.1665 1.90443 1.1665 1.74964C1.1665 1.59485 1.22799 1.44641 1.33744 1.33696C1.44689 1.2275 1.59534 1.16602 1.75013 1.16602C1.90492 1.16602 2.05336 1.2275 2.16281 1.33696L6.99984 6.17471L11.8369 1.33696C11.9463 1.2275 12.0948 1.16602 12.2495 1.16602C12.4043 1.16602 12.5528 1.2275 12.6622 1.33696C12.7717 1.44641 12.8332 1.59485 12.8332 1.74964C12.8332 1.90443 12.7717 2.05288 12.6622 2.16233L7.82448 6.99935L12.6622 11.8364Z" fill="white"/>
              </svg>
            </div>
            <div class="flex items-start justify-between w-full">
              <header class="flex items-center justify-between w-full">
              <div class = "flex items-center gap-4">
                <img class="w-12 h-12 rounded-full object-cover" src="${
                  post.author.profileImage
                }" alt="${post.author.name}">
                <div>
                  <h2 class="font-semibold text-white">${post.author.name}</h2>
                  <time class="text-sm text-white">${post.date}</time>
                </div>
                </div>
                <!-- Three Dots -->
<div x-data="{ post: $store.postModalData.post, editDeletePost: false, openedWithKeyboard: false }"
     x-show="post.authorId === '171031'"
     class="relative w-fit"
     x-on:keydown.esc.window="editDeletePost = false; openedWithKeyboard = false"
     x-ref="postModal">
                  <div class="size-4 cursor-pointer" x-on:click="editDeletePost = ! editDeletePost" aria-haspopup="true"
                      x-on:keydown.space.prevent="openedWithKeyboard = true"
                      x-on:keydown.enter.prevent="openedWithKeyboard = true"
                      x-on:keydown.down.prevent="openedWithKeyboard = true"
                      x-bind:class="editDeletePost || openedWithKeyboard ? 'text-on-surface-strong dark:text-on-surface-dark-strong' : 'text-on-surface dark:text-on-surface-dark'"
                      x-bind:aria-expanded="editDeletePost || openedWithKeyboard">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                              d="M8.66666 7.99998C8.66666 8.19776 8.60801 8.3911 8.49813 8.55555C8.38824 8.72 8.23207 8.84817 8.04934 8.92386C7.86661 8.99955 7.66555 9.01935 7.47157 8.98076C7.27759 8.94218 7.0994 8.84694 6.95955 8.70709C6.8197 8.56723 6.72446 8.38905 6.68587 8.19507C6.64729 8.00109 6.66709 7.80002 6.74278 7.6173C6.81847 7.43457 6.94664 7.27839 7.11109 7.16851C7.27554 7.05863 7.46888 6.99998 7.66666 6.99998C7.93187 6.99998 8.18623 7.10534 8.37376 7.29287C8.5613 7.48041 8.66666 7.73476 8.66666 7.99998ZM7.66666 3.33331C7.86444 3.33331 8.05778 3.27466 8.22223 3.16478C8.38668 3.0549 8.51485 2.89872 8.59054 2.716C8.66622 2.53327 8.68603 2.3322 8.64744 2.13822C8.60886 1.94424 8.51362 1.76606 8.37376 1.62621C8.23391 1.48635 8.05573 1.39111 7.86175 1.35253C7.66777 1.31394 7.4667 1.33375 7.28397 1.40943C7.10125 1.48512 6.94507 1.61329 6.83519 1.77774C6.72531 1.94219 6.66666 2.13553 6.66666 2.33331C6.66666 2.59853 6.77201 2.85288 6.95955 3.04042C7.14709 3.22796 7.40144 3.33331 7.66666 3.33331ZM7.66666 12.6666C7.46888 12.6666 7.27554 12.7253 7.11109 12.8352C6.94664 12.9451 6.81847 13.1012 6.74278 13.284C6.66709 13.4667 6.64729 13.6678 6.68587 13.8617C6.72446 14.0557 6.8197 14.2339 6.95955 14.3738C7.0994 14.5136 7.27759 14.6088 7.47157 14.6474C7.66555 14.686 7.86661 14.6662 8.04934 14.5905C8.23207 14.5148 8.38824 14.3867 8.49813 14.2222C8.60801 14.0578 8.66666 13.8644 8.66666 13.6666C8.66666 13.4014 8.5613 13.1471 8.37376 12.9595C8.18623 12.772 7.93187 12.6666 7.66666 12.6666Z"
                              fill="white" />
                      </svg>
                  </div>
                  <div x-cloak x-show="editDeletePost || openedWithKeyboard" x-transition x-trap="openedWithKeyboard"
                      x-on:click.outside="editDeletePost = false, openedWithKeyboard = false"
                      x-on:keydown.down.prevent="$focus.wrap().next()" x-on:keydown.up.prevent="$focus.wrap().previous()"
                      class="absolute top-5 right-0 flex p-1 bg-[#084D55] rounded w-[100px] flex-col shadow-[0px_4px_4px_0px_#0000000F]">
                            <button @click = "
                                                document.querySelector('.post-editor').textContent = '${
                                                  post.content
                                                }';
                                                let postModal = document.getElementById('postNewModal');
                                                let postElement = document.querySelector('.postCard');
                                                postModal.setAttribute('data-postid', ${
                                                  post.id
                                                });
                                                postModal.querySelector('#edit-post').classList.remove('hidden');
                                                postModal.querySelector('#submit-post').classList.add('hidden');
                                                postModal.show();"
                            type="button" data-post-id="{{:id}}" class="editPostModal edit-post-btn p-[10px] hover:bg-primary-100 transition-all text-white rounded cursor-pointer o3 text-left">Edit</button>
                            <button 
                            type="button" 
                            data-post-id="${post.id}" 
                            class="delete-post-btn p-[10px] hover:bg-primary-100 transition-all text-white rounded cursor-pointer o3 text-left
                              @click = "
                              let postModal = document.getElementById('postNewModal');
                              postModal.hide();
                              "
                            ">
                            Delete
                            </button>

                  </div>
              </div>
              <!-- Three Dots Ends -->
              </header>
            </div>
            <div class="post-content">
              ${
                post.title
                  ? `<h3 class="text-xl text-white font-medium mb-2">${post.title}</h3>`
                  : ""
              }
              ${
                post.post_image
                  ? `<img class="min-[500px]:hidden size-full" src="${post.post_image}" alt="Post image" class="object-cover">`
                  : ""
              }
              ${
                post.content
                  ? `<div class="text-white ">${post.content}</div>`
                  : ""
              }
            </div>
            
            <!-- Post Cmt Like Bookmark -->
                        <div class="flex items-center justify-between w-full">
                            <div class="flex items-center gap-6 max-[500px]:gap-3">
                                <div class="flex items-center gap-2 cursor-pointer">
                                    <div class="flex items-center gap-2 cursor-pointer vote-container">
                                        <button class="vote-button" data-post-id="{{:id}}">
                                            <!-- Filled heart -->
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M22 8.18423C22.0015 8.8644 21.8682 9.53811 21.6076 10.1664C21.3471 10.7947 20.9646 11.3651 20.4823 11.8446L12.5097 19.9351C12.4432 20.0025 12.364 20.0561 12.2766 20.0927C12.1893 20.1293 12.0955 20.1481 12.0008 20.1481C11.9061 20.1481 11.8123 20.1293 11.725 20.0927C11.6376 20.0561 11.5584 20.0025 11.4919 19.9351L3.51935 11.8446C2.54736 10.8738 2.00084 9.55668 2 8.18292C1.99916 6.80916 2.54408 5.49134 3.51489 4.51935C4.48569 3.54736 5.80285 3.00084 7.17661 3C8.55037 2.99916 9.8682 3.54409 10.8402 4.51489L12.0008 5.59962L13.1695 4.51132C13.8948 3.78958 14.8177 3.29892 15.8217 3.10128C16.8257 2.90364 17.8657 3.00788 18.8104 3.40085C19.7552 3.79381 20.5624 4.45788 21.1301 5.30922C21.6977 6.16055 22.0004 7.16099 22 8.18423Z"
                                                    fill="#C29D68" />
                                            </svg>
                                        </button>
                                        <div class="o1 text-white postVoteCount">${
                                          post.PostVotesCount
                                        }</div>
                                    </div>
                                </div>
                                <button class="!flex items-center gap-2 load-comments-btn cursor-pointer" data-post-id="{{:id}}">
                                    <div class="size-6 cursor-pointer">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M12.375 2.25C9.88943 2.25273 7.50645 3.24133 5.74889 4.99889C3.99133 6.75645 3.00273 9.13943 3 11.625V19.5C3 19.8978 3.15804 20.2794 3.43934 20.5607C3.72064 20.842 4.10218 21 4.5 21H12.375C14.8614 21 17.246 20.0123 19.0041 18.2541C20.7623 16.496 21.75 14.1114 21.75 11.625C21.75 9.1386 20.7623 6.75403 19.0041 4.99587C17.246 3.23772 14.8614 2.25 12.375 2.25ZM15.375 14.25H9C8.80109 14.25 8.61032 14.171 8.46967 14.0303C8.32902 13.8897 8.25 13.6989 8.25 13.5C8.25 13.3011 8.32902 13.1103 8.46967 12.9697C8.61032 12.829 8.80109 12.75 9 12.75H15.375C15.5739 12.75 15.7647 12.829 15.9053 12.9697C16.046 13.1103 16.125 13.3011 16.125 13.5C16.125 13.6989 16.046 13.8897 15.9053 14.0303C15.7647 14.171 15.5739 14.25 15.375 14.25ZM15.375 11.25H9C8.80109 11.25 8.61032 11.171 8.46967 11.0303C8.32902 10.8897 8.25 10.6989 8.25 10.5C8.25 10.3011 8.32902 10.1103 8.46967 9.96967C8.61032 9.82902 8.80109 9.75 9 9.75H15.375C15.5739 9.75 15.7647 9.82902 15.9053 9.96967C16.046 10.1103 16.125 10.3011 16.125 10.5C16.125 10.6989 16.046 10.8897 15.9053 11.0303C15.7647 11.171 15.5739 11.25 15.375 11.25Z"
                                                fill="#C29D68" />
                                        </svg>
                                    </div>
                                    <div class="o1 text-white postCommentCount">${
                                      post.PostCommentCount
                                    }</div>
                                </button>
                            </div>
                            <!-- Bookmark -->
                            <button class="bookmark-button" data-post-id="{{:id}}">
                                <!-- Outline bookmark icon -->
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M17.857 2H6.42856C6.04968 2 5.68632 2.15051 5.41841 2.41841C5.15051 2.68632 5 3.04968 5 3.42856V21.3876C4.99996 21.4969 5.02919 21.6042 5.08464 21.6984C5.1401 21.7926 5.21976 21.8702 5.31536 21.9232C5.41095 21.9762 5.51899 22.0026 5.62826 21.9998C5.73753 21.9969 5.84403 21.9649 5.93673 21.9069L12.1418 18.0294L18.3488 21.9069C18.4415 21.9649 18.548 21.9969 18.6573 21.9998C18.7666 22.0026 18.8746 21.9762 18.9702 21.9232C19.0658 21.8702 19.1455 21.7926 19.2009 21.6984C19.2564 21.6042 19.2856 21.4969 19.2856 21.3876V3.42856C19.2856 3.04968 19.1351 2.68632 18.8672 2.41841C18.5992 2.15051 18.2359 2 17.857 2ZM18.0611 20.2825L12.4662 16.7866C12.3689 16.7258 12.2565 16.6935 12.1418 16.6935C12.027 16.6935 11.9146 16.7258 11.8173 16.7866L6.22448 20.2825V3.42856C6.22448 3.37443 6.24598 3.32252 6.28425 3.28425C6.32252 3.24598 6.37443 3.22448 6.42856 3.22448H17.857C17.9111 3.22448 17.963 3.24598 18.0013 3.28425C18.0396 3.32252 18.0611 3.37443 18.0611 3.42856V20.2825Z"
                                        fill="#C29D68" />
                                </svg>
       
                            </button>
                        </div>
                        <!-- Post Cmt Like Bookmark End -->
                        <div class="h-[2px] w-full bg-[#d9d9d9]"></div>
                                      
              <!-- Add comment form -->
              <div class="comment-form-wrapper mb-4 flex flex-col gap-4 border border-gray-600 active:border-[#ffffff] focus:border-[#ffffff] comment-form flex items-center gap-3 w-full bg-primary-100 min-[500px]:rounded max-[500px]:p-4 z-[999] max-[500px]:!z-[99999] max-[500px]:fixed bottom-0 right-0 w-full max-[500px]:bg-primary">
                  <div id="comment-editor" class="relative h-[80px] editor comment-editor text-white p-2 w-full h-10 !border-none !focus-visible:border-none rounded" contenteditable="true"></div>
                  <div class="flex items-center justify-between w-full p-2">
                      <div class="flex items-center gap-3">
                          <button class="icon-button" type="button">
                              <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                      d="M13.5 3H2.5C2.23478 3 1.98043 3.10536 1.79289 3.29289C1.60536 3.48043 1.5 3.73478 1.5 4V13C1.5 13.2652 1.60536 13.5196 1.79289 13.7071C1.98043 13.8946 2.23478 14 2.5 14H13.5C13.7652 14 14.0196 13.8946 14.2071 13.7071C14.3946 13.5196 14.5 13.2652 14.5 13V4C14.5 3.73478 14.3946 3.48043 14.2071 3.29289C14.0196 3.10536 13.7652 3 13.5 3ZM13.5 4V10.4219L11.8706 8.79313C11.7778 8.70024 11.6675 8.62656 11.5462 8.57629C11.4248 8.52602 11.2948 8.50015 11.1634 8.50015C11.0321 8.50015 10.902 8.52602 10.7807 8.57629C10.6594 8.62656 10.5491 8.70024 10.4563 8.79313L9.20625 10.0431L6.45625 7.29313C6.26873 7.10573 6.01448 7.00046 5.74937 7.00046C5.48427 7.00046 5.23002 7.10573 5.0425 7.29313L2.5 9.83562V4H13.5ZM2.5 11.25L5.75 8L10.75 13H2.5V11.25ZM13.5 13H12.1644L9.91438 10.75L11.1644 9.5L13.5 11.8363V13ZM9 6.75C9 6.60166 9.04399 6.45666 9.1264 6.33332C9.20881 6.20999 9.32594 6.11386 9.46299 6.05709C9.60003 6.00032 9.75083 5.98547 9.89632 6.01441C10.0418 6.04335 10.1754 6.11478 10.2803 6.21967C10.3852 6.32456 10.4566 6.4582 10.4856 6.60368C10.5145 6.74917 10.4997 6.89997 10.4429 7.03701C10.3861 7.17406 10.29 7.29119 10.1667 7.3736C10.0433 7.45601 9.89834 7.5 9.75 7.5C9.55109 7.5 9.36032 7.42098 9.21967 7.28033C9.07902 7.13968 9 6.94891 9 6.75Z"
                                      fill="#C29D68" />
                              </svg>
                          </button>
                          <button class="icon-button" type="button">
                              <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                      d="M8.24421 10.1663C9.64153 10.1663 10.774 9.04729 10.774 7.66634V4.33301C10.774 2.95206 9.64153 1.83301 8.24421 1.83301C6.84689 1.83301 5.71445 2.95206 5.71445 4.33301V7.66634C5.71445 9.04729 6.84689 10.1663 8.24421 10.1663ZM13.1549 7.63658C13.1549 7.5711 13.1014 7.51753 13.0359 7.51753H12.143C12.0775 7.51753 12.024 7.5711 12.024 7.63658C12.024 9.72438 10.332 11.4163 8.24421 11.4163C6.15641 11.4163 4.46445 9.72438 4.46445 7.63658C4.46445 7.5711 4.41088 7.51753 4.3454 7.51753H3.45254C3.38707 7.51753 3.3335 7.5711 3.3335 7.63658C3.3335 10.147 5.21742 12.2184 7.64897 12.5116V14.0354H5.48677C5.2829 14.0354 5.11921 14.2482 5.11921 14.5116V15.0473C5.11921 15.1128 5.16088 15.1663 5.21147 15.1663H11.2769C11.3275 15.1663 11.3692 15.1128 11.3692 15.0473V14.5116C11.3692 14.2482 11.2055 14.0354 11.0017 14.0354H8.77992V12.519C11.2397 12.2512 13.1549 10.1678 13.1549 7.63658Z"
                                      fill="#C29D68" />
                              </svg>
                          </button>
                          <button class="icon-button" type="button">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                      d="M11.1107 4.88888V11.1111C11.1107 11.3468 11.0171 11.5729 10.8504 11.7396C10.6837 11.9063 10.4576 12 10.2219 12H2.22189C1.98615 12 1.76005 11.9063 1.59336 11.7396C1.42666 11.5729 1.33301 11.3468 1.33301 11.1111V4.88888C1.33301 4.65314 1.42666 4.42705 1.59336 4.26035C1.76005 4.09365 1.98615 4 2.22189 4H10.2219C10.4576 4 10.6837 4.09365 10.8504 4.26035C11.0171 4.42705 11.1107 4.65314 11.1107 4.88888ZM14.3329 4.90277C14.2702 4.88743 14.205 4.88554 14.1415 4.89722C14.078 4.9089 14.0177 4.93389 13.9646 4.97055L12.0985 6.21443C12.0681 6.23474 12.0431 6.26226 12.0259 6.29453C12.0086 6.3268 11.9996 6.36284 11.9996 6.39943V9.60053C11.9996 9.63712 12.0086 9.67316 12.0259 9.70543C12.0431 9.7377 12.0681 9.76522 12.0985 9.78553L13.9752 11.0366C14.0454 11.0835 14.1276 11.1094 14.212 11.1112C14.2964 11.1131 14.3796 11.0909 14.4518 11.0472C14.5187 11.0047 14.5735 10.9458 14.611 10.876C14.6486 10.8063 14.6676 10.7281 14.6663 10.6489V5.33333C14.6663 5.23476 14.6336 5.13897 14.5733 5.06103C14.5129 4.98309 14.4284 4.92742 14.3329 4.90277Z"
                                      fill="#C29D68" />
                              </svg>
                          </button>
                      </div>
                      <button id="submit-comment"
                          class="w-fit bg-secondary text-white px-4 py-2 rounded hover:bg-secondary-200 transition-colors flex items-center gap-2">
                          <span>Comment</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M11.1662 5.99246C11.1666 6.14096 11.1273 6.28687 11.0524 6.41509C10.9775 6.54331 10.8697 6.64919 10.7401 6.72177L1.99252 11.7233C1.86699 11.7944 1.72527 11.8321 1.58098 11.8327C1.44803 11.832 1.31719 11.7995 1.19936 11.7379C1.08154 11.6763 0.980152 11.5874 0.903674 11.4787C0.827196 11.3699 0.777842 11.2444 0.759734 11.1127C0.741625 10.981 0.755286 10.8469 0.799577 10.7215L2.20611 6.55663C2.21985 6.51591 2.24585 6.48044 2.28055 6.45507C2.31524 6.42971 2.35693 6.41569 2.3999 6.41494H6.16523C6.22236 6.41506 6.27891 6.40344 6.33136 6.38079C6.38381 6.35814 6.43104 6.32495 6.47012 6.28328C6.50921 6.24161 6.5393 6.19235 6.55855 6.13855C6.57779 6.08476 6.58576 6.02758 6.58198 5.97058C6.57253 5.86341 6.52294 5.76377 6.44315 5.69162C6.36336 5.61946 6.25926 5.5801 6.15168 5.58144H2.40094C2.35734 5.58144 2.31484 5.56777 2.27943 5.54235C2.24401 5.51693 2.21745 5.48105 2.2035 5.43974L0.796973 1.27537C0.74099 1.11575 0.734897 0.942879 0.779504 0.779715C0.82411 0.616551 0.917305 0.470821 1.04671 0.361883C1.17611 0.252946 1.33559 0.185958 1.50397 0.169819C1.67235 0.15368 1.84166 0.189153 1.9894 0.271527L10.7411 5.26679C10.87 5.3392 10.9772 5.44457 11.0519 5.57208C11.1266 5.69959 11.1661 5.84468 11.1662 5.99246Z"
                                  fill="#ffffff" />
                          </svg>
                      </button>
                  </div>
              </div>
            <section id="modal-comments-section" class="h-[50vh] max-[500px]:pb-[150px] overflow-auto ${
              post.post_image ? `max-[500px]:h-[45vh] ` : "max-[500px]:h-[70vh]"
            }">
              <div class="my-4 text-white text-sm font-['Avenir LT Std'] leading-[14px]">Comments</div>
              <div id="modal-comments-container" class="space-y-4 modal-comments-container-${
                post.id
              }">
                <p class="text-gray-300">Loading comments...</p>
              </div>
            </section>
          </article>
        </div>
      </div>
    `;
    // Initialize mention functionality for comments
    const commentEditor = document.getElementById("comment-editor");
    MentionManager.tribute.attach(commentEditor);

    // Add comment submit handler
    document
      .getElementById("submit-comment")
      .addEventListener("click", async () => {
        const commentForm = document.querySelector(".comment-form-wrapper");
        const editor = document.getElementById("comment-editor");
        const content = editor.innerText.trim();
        const mentions = Array.from(editor.querySelectorAll(".mention")).map(
          (el) => el.dataset.contactId
        );
        commentForm.classList.add("state-disabled");
        editor.innerHTML = "";
        if (!content) {
          UIManager.showError("Comment cannot be empty");
          return;
        }
        try {
          await forumManager.createComment(post.id, content, mentions);
        } catch (error) {
        } finally {
          commentForm.classList.remove("state-disabled");
        }
      });
    await PostModalManager.loadComments(post.id);
  }

  static async confirmDeleteComment(commentId) {
    const confirmed = await UIManager.showDeleteConfirmation(
      "Are you sure you want to delete this comment?"
    );
    if (!confirmed) return;
    try {
      await PostModalManager.deleteComment(commentId);
      document.querySelector(`[data-comment-id="${commentId}"]`).remove();
      UIManager.showSuccess("Comment deleted successfully.");
    } catch (error) {
      UIManager.showError("Failed to delete comment.");
    }
  }

  static async deleteComment(commentId) {
    const query = `
      mutation deleteForumComment($id: PriestessForumCommentID) {
        deleteForumComment(query: [{ where: { id: $id } }]) {
          id
        }
      }
    `;
    const variables = { id: commentId };
    const toDeleteComment = document.querySelector(
      `[data-comment-id="${commentId}"]`
    );
    toDeleteComment.classList.add("state-disabled");
    await ApiService.query(query, variables);
  }

  static async loadComments(postId) {
    try {
      const comments = await forumManager.fetchComments(postId);
      await Promise.all(
        comments.map(async (comment) => {
          const voteRecords = await forumManager.fetchVoteForComment(
            comment.id
          );
          comment.isCommentVoted = voteRecords.length > 0;
          comment.voteCommentCount = voteRecords.length;
        })
      );

      const commentsContainer = document.getElementById(
        "modal-comments-container"
      );
      const commentTemplate = $.templates("#comment-template");
      commentsContainer.innerHTML = commentTemplate.render(comments);

      document.querySelectorAll(".delete-comment-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const commentId = e.target.dataset.commentId;
          PostModalManager.confirmDeleteComment(commentId);
        });
      });

      const replyEditors = commentsContainer.querySelectorAll(".reply-editor");
      replyEditors.forEach((editor) => {
        setTimeout(() => {
          MentionManager.tribute.attach(editor);
        }, 500);
      });

      loadRepliesForComments(comments);
    } catch (error) {
      document.getElementById(
        "modal-comments-container"
      ).innerHTML = `<p class="text-red-300">Error loading comments</p>`;
    }

    async function loadRepliesForComments(comments) {
      await Promise.all(
        comments.map(async (comment) => {
          try {
            const replies = await forumManager.fetchReplies(comment.id);

            await Promise.all(
              replies.map(async (reply) => {
                const voteRecords = await forumManager.fetchVoteForReply(
                  reply.id
                );
                reply.isReplyVoted = voteRecords.length > 0;
                reply.voteReplyCount = voteRecords.length;
              })
            );

            const container = document.querySelector(
              `[data-comment-id="${comment.id}"] .replies-container`
            );
            if (container) {
              const replyTemplate = $.templates("#reply-template");
              container.innerHTML = replies
                .map((reply) => replyTemplate.render(reply))
                .join("");
            }
          } catch (error) {}
        })
      );
    }
  }
}
