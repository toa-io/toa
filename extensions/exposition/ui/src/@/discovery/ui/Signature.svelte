<script lang="ts">
  import { server } from '@/discovery'
</script>

<!--
  What answered, at the foot of the page. The line is the gateway's own — data, not copy, so
  nothing here goes through the dictionary. The element stands whether or not the line has
  arrived, and holds one line of its own height, so the first reply fills it in place.
-->
<footer class="text-muted-foreground mt-auto min-h-4 px-4 pt-2 pb-6 text-center text-[10px]">
  {$server ?? ''}
</footer>
