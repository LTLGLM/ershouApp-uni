<script>
import { mapActions, mapGetters } from "vuex";
export default {
  onLaunch: function () {
    if (!this.websocketClient) {
      this.initWebSocketClient("websocket");
      console.log(this.websocketClient);
    }
  },
  computed: {
    ...mapGetters(["websocketClient"]),
  },
  methods: {
    ...mapActions(["initWebSocketClient"]),
  },
  onShow: function () {
    console.log("App Show");
  },
  onHide: function () {
    console.log("App Hide");
  },
};
</script>

<style scoped lang="scss">
@import "uview-ui/index.scss";
/*每个页面公共css */
</style>
