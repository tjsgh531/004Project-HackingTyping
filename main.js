const hackSection = document.getElementById('hackingSection');
let hackStr = "<div id=\"console\" class=\"outer\"><br><br><br>struct&nbsp;group_info&nbsp;init_groups&nbsp;=&nbsp;{&nbsp;.usage&nbsp;=&nbsp;ATOMIC_INIT(2)&nbsp;};<br><br>struct&nbsp;group_info&nbsp;*groups_alloc(int&nbsp;gidsetsize){<br><br>&nbsp;&nbsp;&nbsp;&nbsp;struct&nbsp;group_info&nbsp;*group_info;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;int&nbsp;nblocks;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;int&nbsp;i;<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;nblocks&nbsp;=&nbsp;(gidsetsize&nbsp;+&nbsp;NGROUPS_PER_BLOCK&nbsp;-&nbsp;1)&nbsp;/&nbsp;NGROUPS_PER_BLOCK;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;/*&nbsp;Make&nbsp;sure&nbsp;we&nbsp;always&nbsp;allocate&nbsp;at&nbsp;least&nbsp;one&nbsp;indirect&nbsp;block&nbsp;pointer&nbsp;*/<br><br>&nbsp;&nbsp;&nbsp;&nbsp;nblocks&nbsp;=&nbsp;nblocks&nbsp;?&nbsp;:&nbsp;1;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;group_info&nbsp;=&nbsp;kmalloc(sizeof(*group_info)&nbsp;+&nbsp;nblocks*sizeof(gid_t&nbsp;*),&nbsp;GFP_USER);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(!group_info)<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;NULL;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;group_info-&gt;ngroups&nbsp;=&nbsp;gidsetsize;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;group_info-&gt;nblocks&nbsp;=&nbsp;nblocks;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;atomic_set(&amp;group_info-&gt;usage,&nbsp;1);<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(gidsetsize&nbsp;&lt;=&nbsp;NGROUPS_SMALL)<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;group_info-&gt;blocks[0]&nbsp;=&nbsp;group_info-&gt;small_block;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;else&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for&nbsp;(i&nbsp;=&nbsp;0;&nbsp;i&nbsp;&lt;&nbsp;nblocks;&nbsp;i++)&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;gid_t&nbsp;*b;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;b&nbsp;=&nbsp;(void&nbsp;*)__get_free_page(GFP_USER);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(!b)<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;goto&nbsp;out_undo_partial_alloc;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;group_info-&gt;blocks[i]&nbsp;=&nbsp;b;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;group_info;<br><br><br><br>out_undo_partial_alloc:<br><br>&nbsp;&nbsp;&nbsp;&nbsp;while&nbsp;(--i&nbsp;&gt;=&nbsp;0)&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;free_page((unsigned&nbsp;long)group_info-&gt;blocks[i]);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;kfree(group_info);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;NULL;<br><br>}<br><br><br><br>EXPORT_SYMBOL(groups_alloc);<br><br><br><br>void&nbsp;groups_free(struct&nbsp;group_info&nbsp;*group_info)<br><br>{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(group_info-&gt;blocks[0]&nbsp;!=&nbsp;group_info-&gt;small_block)&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;int&nbsp;i;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for&nbsp;(i&nbsp;=&nbsp;0;&nbsp;i&nbsp;&lt;&nbsp;group_info-&gt;nblocks;&nbsp;i++)<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;free_page((unsigned&nbsp;long)group_info-&gt;blocks[i]);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;kfree(group_info);<br><br>}<br><br><br><br>EXPORT_SYMBOL(groups_free);<br><br><br><br>/*&nbsp;export&nbsp;the&nbsp;group_info&nbsp;to&nbsp;a&nbsp;user-space&nbsp;array&nbsp;*/<br><br>static&nbsp;int&nbsp;groups_to_user(gid_t&nbsp;__user&nbsp;*grouplist,<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const&nbsp;struct&nbsp;group_info&nbsp;*group_info)<br><br>{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;int&nbsp;i;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;unsigned&nbsp;int&nbsp;count&nbsp;=&nbsp;group_info-&gt;ngroups;<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;for&nbsp;(i&nbsp;=&nbsp;0;&nbsp;i&nbsp;&lt;&nbsp;group_info-&gt;nblocks;&nbsp;i++)&nbsp;{<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unsigned&nbsp;int&nbsp;cp_count&nbsp;=&nbsp;min(NGROUPS_PER_BLOCK,&nbsp;count);<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unsigned&nbsp;int&nbsp;len&nbsp;=&nbsp;cp_count&nbsp;*&nbsp;sizeof(*grouplist);<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if&nbsp;(copy_to_user(grouplist,&nbsp;group_info-&gt;blocks[i],&nbsp;len))<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;-EFAULT;<br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;grouplist&nbsp;+=&nbsp;NGROUPS_PER_BLOCK;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;count&nbsp;-=&nbsp;cp_count;<br><br>&nbsp;&nbsp;&nbsp;&nbsp;}<br><br>&nbsp;&nbsp;&nbsp;&nbsp;return&nbsp;0;<br><br>}<br><br><br><br></div>";
hackStr = hackStr.replace(/&nbsp;/gi,'&nbsp;&nbsp;&nbsp;');

hackStr = hackStr.split(/<br>/gi);
console.log(hackStr);

console.log(hackStr[2] == "");
StringCut("<br>");
function StringCut(...str){
    let resultArr = [];

    let startIdx = [];
    let endIdx = [];
    let temptIdx = [];
    /*
    1. str의 시작인덱스와 끝 인덱스 찾기
    2. str을 제외한 나머지는 다 하나로 끝고 str은 덩어리로 두기
    */ 
    for(let i = 0 ;  i < str.length; i++){
        let temp = "/" + str[i].toString() + "/";
        startIdx[i] = hackStr.search(temp);
        for(let k = 0 ;  k < startIdx[i].length ;  i++){
            temptIdx[k] = startIdx[i][k] + str[i].length;
        }
        endIdx = temptIdx.slice();
        temptIdx = [];  
    }
    console.log(`startIndex : ${startIdx}`);
    console.log(`ednIndex : ${endIdx}`);

}


/*
let ani;
let count = 0;
let string;
const len = test.length;

autoCreate();

function autoCreate(){
    const randNum = Math.floor(Math.random() * 4 + 1);
    const randsec = Math.random()*2;

    for(let i = 0 ; i < randNum ; i++){
        string += test[count].toString();
        count++;

        if(count >= len){
            count = 0;
        }
    }

    hackSection.innerHTML += string;
    string = "";
    ani = requestAnimationFrame(autoCreate);
}

setTimeout(()=>{
    cancelAnimationFrame(ani);
},30000);
*/