const hackSection = document.getElementById('hackingSection');

let hackStr = "<br><br><br>struct&nbsp;group_info&nbsp;init_groups&nbsp;=&nbsp;{&nbsp;.usage&nbsp;=&nbsp;ATOMIC_INIT(2)&nbsp;};<br><br>struct&nbsp;group_info&nbsp;*groups_alloc(int&nbsp;gidsetsize){<br><br>&nbsp;&nbsp;&nbsp;&nbsp;struct&nbsp;group_info&nbsp;*group_info;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;int&nbsp;nblocks;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;int&nbsp;i;<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;nblocks&nbsp;=&nbsp;(gidsetsize&nbsp;+&nbsp;NGROUPS_PER_BLOCK&nbsp;-&nbsp;1)&nbsp;/&nbsp;NGROUPS_PER_BLOCK;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;/*&nbsp;Make&nbsp;sure&nbsp;we&nbsp;always&nbsp;allocate&nbsp;at&nbsp;least&nbsp;one&nbsp;indirect&nbsp;block&nbsp;pointer&nbsp;*/<br><br>&nbsp;&nbsp;&nbsp;&nbsp;nblocks&nbsp;=&nbsp;nblocks&nbsp;?&nbsp;:&nbsp;1;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;group_info&nbsp;=&nbsp;kmalloc(sizeof(*group_info)&nbsp;+&nbsp;nblocks*sizeof(gid_t&nbsp;*),&nbsp;GFP_USER);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(!group_info)<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;NULL;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;group_info-&gt;ngroups&nbsp;=&nbsp;gidsetsize;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;group_info-&gt;nblocks&nbsp;=&nbsp;nblocks;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;atomic_set(&amp;group_info-&gt;usage,&nbsp;1);<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(gidsetsize&nbsp;&lt;=&nbsp;NGROUPS_SMALL)<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;group_info-&gt;blocks[0]&nbsp;=&nbsp;group_info-&gt;small_block;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;else&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for&nbsp;(i&nbsp;=&nbsp;0;&nbsp;i&nbsp;&lt;&nbsp;nblocks;&nbsp;i++)&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;gid_t&nbsp;*b;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;b&nbsp;=&nbsp;(void&nbsp;*)__get_free_page(GFP_USER);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(!b)<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;goto&nbsp;out_undo_partial_alloc;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;group_info-&gt;blocks[i]&nbsp;=&nbsp;b;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;group_info;<br><br><br><br>out_undo_partial_alloc:<br><br>&nbsp;&nbsp;&nbsp;&nbsp;while&nbsp;(--i&nbsp;&gt;=&nbsp;0)&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;free_page((unsigned&nbsp;long)group_info-&gt;blocks[i]);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;kfree(group_info);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;NULL;<br><br>}<br><br><br><br>EXPORT_SYMBOL(groups_alloc);<br><br><br><br>void&nbsp;groups_free(struct&nbsp;group_info&nbsp;*group_info)<br><br>{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(group_info-&gt;blocks[0]&nbsp;!=&nbsp;group_info-&gt;small_block)&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;int&nbsp;i;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for&nbsp;(i&nbsp;=&nbsp;0;&nbsp;i&nbsp;&lt;&nbsp;group_info-&gt;nblocks;&nbsp;i++)<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;free_page((unsigned&nbsp;long)group_info-&gt;blocks[i]);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;kfree(group_info);<br><br>}<br><br><br><br>EXPORT_SYMBOL(groups_free);<br><br><br><br>/*&nbsp;export&nbsp;the&nbsp;group_info&nbsp;to&nbsp;a&nbsp;user-space&nbsp;array&nbsp;*/<br><br>static&nbsp;int&nbsp;groups_to_user(gid_t&nbsp;__user&nbsp;*grouplist,<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const&nbsp;struct&nbsp;group_info&nbsp;*group_info)<br><br>{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;int&nbsp;i;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;unsigned&nbsp;int&nbsp;count&nbsp;=&nbsp;group_info-&gt;ngroups;<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;for&nbsp;(i&nbsp;=&nbsp;0;&nbsp;i&nbsp;&lt;&nbsp;group_info-&gt;nblocks;&nbsp;i++)&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unsigned&nbsp;int&nbsp;cp_count&nbsp;=&nbsp;min(NGROUPS_PER_BLOCK,&nbsp;count);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unsigned&nbsp;int&nbsp;len&nbsp;=&nbsp;cp_count&nbsp;*&nbsp;sizeof(*grouplist);<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(copy_to_user(grouplist,&nbsp;group_info-&gt;blocks[i],&nbsp;len))<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;-EFAULT;<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;grouplist&nbsp;+=&nbsp;NGROUPS_PER_BLOCK;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;count&nbsp;-=&nbsp;cp_count;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;0;<br><br>}<br><br><br><br>";
hackStr = hackStr.replace(/&nbsp;/gi,'&nbsp;&nbsp;');

let TargetArr = [...hackStr];

let countIndex = 0;

let slicedHackStrArr = sliceSpecial("<br>","&nbsp;");
onPrint();

function sliceSpecial(...str){

    str.forEach(element => {
        let len = element.length;
        let firstWord = element.charAt(0);
        
        let count = 0;

        let suspicionIndex;
        let suspicionStr;
        let tempArr;
        
        while(true){
            tempArr = [];
            suspicionStr ='';
            suspicionIndex = TargetArr.indexOf(firstWord,count);
            console.log(`suspicionIndex : ${suspicionIndex}`);
            if(suspicionIndex == -1){
                break;
            }

            for(let i = 0 ; i < len; i++){
                tempArr.push(TargetArr[suspicionIndex+i]);
            }
            suspicionStr = tempArr.join('');

            if(suspicionStr === element){
                TargetArr.splice(suspicionIndex,len,suspicionStr);
            }
            else{
                count = suspicionIndex+1;
            }
            
        }
    });

    console.log(`TargetArr : ${TargetArr}`);
    console.log(`hackStr : ${hackStr}`);
}

function onPrint(){
    const randNum = Math.floor(Math.random() *3 +1);
    
    for(let i = countIndex ; i < countIndex + randNum; i++){
        hackSection.innerHTML += TargetArr[i];
    }
    countIndex += randNum;
    //freeze걸어줘야함 최대 2초

    requestAnimationFrame(onPrint);
}