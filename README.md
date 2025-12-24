# LSZ
## Badges
[![](https://data.jsdelivr.com/v1/package/gh/lukassz111/lsz/badge)](https://www.jsdelivr.com/package/gh/lukassz111/lsz)
## Usage

### data-lsz-conditional-class='[{ "class": "true", "condition": "isParentOf(p)"} ]'
### data-lsz-conditional-class='[{ "class": "true", "condition": "isAncestorOf(p)"} ]'
### data-lsz-conditional-class='[{ "class": "true", "condition": "( false() or true() )"} ]'
### data-lsz-conditional-class='[{ "class": "true", "condition": "( false() and true() )"} ]'
### class lsz-css-scroll


            <div data-lsz-html-content="<h1>This content was set dynamically using Lukassz111 Basic Addon</h1><span>It uses attribute data-lsz-html-content to set innerHTML of the element</span>"></div>
            <div data-lsz-html-content="<span>Some html prefix: data-custom-attr = "{{ attr(data-custom-attr) }}" and some suffix </span>" data-custom-attr="Value of some custom attribute"></div>
            <div data-lsz-html-content="non existing class attrib / {{ attr(class) }}"></div>
            <div class="some-example-class" data-lsz-html-content="Class attribute of this element is: {{ attr(class) }}"></div>
            <div data-arg-1="Arg 1" data-arg-2="Arg 2" data-lsz-html-content="<ul><li>{{ attr(data-arg-1) }}</li><li>{{ attr(data-arg-2) }}</li></ul>"></div>
            <div data-lsz-fetch-html-content="./fragment_demo.html"></div>


## Initial
