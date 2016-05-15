# Comet v1.0 Alpha Changelog

*__Note:__ This changelog is in development, and is updated alongside the project. It should by no means be considered final.*

**Overview:**  
This iteration improves extensively on the previous version of Comet, and will be used for the second stage of Alpha testing.

**Changelog:**
 * Some pages are now loaded dynamically (take note of the pretty loading bar).
 * Push messages and modals will now stay on the screen across dynamic page loads.
 * Modal system has been drastically improved.
	* Modals can now be queued.
 * [Technical] No longer using [Django-Socketio](https://github.com/stephenmcd/django-socketio) as it is incredibly out of date. Now simply using [Gevent-Socketio](https://github.com/abourget/gevent-socketio). This has required an extensive redesign, but will improve the quality of the final product quite extensively. Hence the reason why this is v1.0 and not v0.2.
