// ==UserScript==
// @name         BBO_button
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds BBO buttons to gambler deal page
// @author       You
// @match        https://*.gambler.ru/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    const gambler_suit_to_str = {'Б': 'n', '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c'};
    const bidflow = {'n': 0, 'e': 1, 's': 2, 'w': 3};

    main();

    function main() {
        add_bbo_btn();
    }

    function add_bbo_btn() {
        const sheets = document.querySelectorAll("div.sheet > div.diagram");
        sheets.forEach((diagram) => {
            const pre = diagram.parentElement;
            const btn_ask = document.createElement("button");
            btn_ask.textContent = "BBO *";
            btn_ask.classList.add("bbo-btn")
            btn_ask.addEventListener("click", () =>
                                     gambler_to_bbo(diagram, '')
                                    );
            pre.appendChild(btn_ask);

            const txt_contr = gambler_contract(diagram);
            const contr = txt_contr_to_3d(txt_contr);
            if (is_contract(contr)) {
                const btn_contr = document.createElement("button")
                btn_contr.textContent = "BBO " + txt_contr;
                btn_contr.classList.add("bbo-btn");
                btn_contr.addEventListener("click", () =>
                                           gambler_to_bbo(diagram, contr)
                                          );
                pre.appendChild(btn_contr);
            }
        })
    }

    function wrap(elem, wrapper) {
        elem.parentNode.insertBefore(wrapper, elem)
        wrapper.appendChild(elem)
    }

    function gambler_to_bbo(diagram, contr) {
        let data = gambler_diagram_to_data(diagram);
        // alert(encodeQueryData(data));
        if (!is_contract(contr)) {
            contr = prompt(
                "Enter contract and declarer (3 letters). Examples: 2sw = 2 spades by West, 3nn = 3NT by North etc.)",
                contr
            ).toLowerCase();
        }
        if (is_contract(contr)) {
            data.a = contr_to_bids(contr, data.d)
        } else {
            alert('Wrong contract. Examples: 3ce = 3 clubs by East, 6ns = 6NT by South');
            return;
        }

        // let link = 'https://www.bridgebase.com/tools/handviewer.html?b=8&d=w&v=both&n=s7hKQJ7632dKcK852&e=sAT654h84d965cQ97&s=sK93hTdAJ7432cAJT&w=sQJ82hA95dQT8c643&a=p4Hppp';
        let link = 'https://www.bridgebase.com/tools/handviewer.html?' + encodeQueryData(data);
        console.log('OPEN contr:' + contr + '|' );
        window.open(link, 'bbo_window');
    }

    function gambler_contract(diagram) {
        const summary = diagram.querySelector("div[class=summary]");
        if (summary == null) {
            return ''
        }
        let txt = summary.textContent;
        console.log(txt);
        let txt_contr = txt.split(' ').slice(0, 2).join('/');
        console.log(txt_contr);
        return txt_contr;
    }

    function txt_contr_to_3d(txt_contr){
        if (txt_contr.length < 4 || ! (txt_contr[1] in gambler_suit_to_str)){
            return ''
        }
        return txt_contr[0] +
            gambler_suit_to_str[txt_contr[1]] +
            txt_contr.at(-1).toLowerCase();
    }

    function is_contract(contr) {
        if (contr.length != 3) return false;
        return '1234567'.includes(contr[0]) &&
            'nshdc'.includes(contr[1]) &&
            'nsew'.includes(contr[2]);
    }

    function contr_to_bids(contr, dealer) {
        let df = bidflow[dealer];
        let rf = bidflow[contr[2]];
        let pcount = rf - df;
        if (pcount < 0) pcount += 4;
        return 'p'.repeat(pcount) + contr.substr(0, 2) + 'ppp';
    }

    function gambler_diagram_to_data(diagram) {
        let data = {};
        let hdr_text = diagram.querySelector("div[position=lt]").textContent.toLowerCase();
        data.b = hdr_text.match(/^\d+/)[0];
        let dz = hdr_text.replaceAll(/\d|\s/g, '').split('/');
        data.d = dz[0].length == 0 ? 'n' : dz[0];
        data.v = dz[1].replace('all', 'both');
        data.n = gambler_col_to_hand(diagram, 't')
        data.w = gambler_col_to_hand(diagram, 'l')
        data.e = gambler_col_to_hand(diagram, 'r')
        data.s = gambler_col_to_hand(diagram, 'b')
        return data;
    }

    function gambler_col_to_hand(diagram, pos) {
        let res = "";
        let suits = diagram.querySelectorAll(`div[position=${pos}] span[class=suitcards]`);
        suits.forEach((child) => {
            res = res + child.getAttribute('data-suit') + child.textContent.substr(1);
        })
        return res.replaceAll('10', 'T');
    }

    function encodeQueryData(data) {
        const ret = [];
        for (let d in data) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]))
        }
        return ret.join('&');
    }

})();